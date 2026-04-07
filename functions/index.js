/**
 * Waitlist HTTP handler.
 *
 * Microsoft List (Graph) + Firestore
 * ---------------------------------
 * Set secret:  firebase functions:secrets:set MS_GRAPH_CLIENT_SECRET
 * Set params (Console → Functions → your function → Environment / params, or .env for emulator):
 *   MS_GRAPH_TENANT_ID       — Entra tenant ID
 *   MS_GRAPH_CLIENT_ID       — App registration (application) client ID
 *   MS_GRAPH_SITE_ID         — Graph site id, NOT the https URL, e.g.
 *                              jivanwellness.sharepoint.com:/sites/JivanWellness
 *   MS_GRAPH_LIST_ID         — Optional. List GUID if you have it.
 *   MS_GRAPH_LIST_DISPLAY_NAME — Optional if LIST_ID set. E.g. Website Interest Form
 *
 * WAITLIST_PRIMARY           — auto | graph | firestore (default auto → graph if MS params + secret set)
 * WAITLIST_MIRROR_TO_FIRESTORE — true | false (default false). If true, also writes Firestore when Graph succeeds.
 *
 * Entra app: application permission Sites.Selected or the minimum needed to write list items on that site;
 * grant admin consent. Prefer Sites.Selected + POST /sites/{id}/permissions for least privilege.
 */

const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret, defineString} = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {createWaitlistListItem, resolveListIdByDisplayName} = require("./microsoftGraph");

admin.initializeApp();

const REGION = "europe-west1";

const msClientSecret = defineSecret("MS_GRAPH_CLIENT_SECRET");

const msTenantId = defineString("MS_GRAPH_TENANT_ID", {default: ""});
const msClientId = defineString("MS_GRAPH_CLIENT_ID", {default: ""});
const msSiteId = defineString("MS_GRAPH_SITE_ID", {default: ""});
const msListId = defineString("MS_GRAPH_LIST_ID", {default: ""});
const msListDisplayName = defineString("MS_GRAPH_LIST_DISPLAY_NAME", {default: ""});

const waitlistPrimary = defineString("WAITLIST_PRIMARY", {
  default: "auto",
  description: "auto | graph | firestore",
});
const waitlistMirrorFirestore = defineString("WAITLIST_MIRROR_TO_FIRESTORE", {
  default: "false",
  description: "true = also write Firestore when Microsoft Graph succeeds",
});

const ALLOWED_INTEREST = new Set([
  "individual",
  "corporate",
  "rTMS",
  "family",
  "medical-tourism",
  "other",
]);

const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_MESSAGE = 5000;

function badRequest(res, message) {
  res.status(400).json({error: message});
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    try {
      const text = req.rawBody.toString("utf8");
      return text ? JSON.parse(text) : {};
    } catch (_) {
      return null;
    }
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch (_) {
      return null;
    }
  }
  return null;
}

function microsoftConfigured(tenant, clientId, siteId, listId, clientSecret) {
  return Boolean(
      tenant &&
      clientId &&
      siteId &&
      listId &&
      clientSecret &&
      clientSecret.trim().length > 0,
  );
}

function resolvePrimary(mode, msReady) {
  const m = (mode || "auto").toLowerCase();
  if (m === "graph") {
    return "graph";
  }
  if (m === "firestore") {
    return "firestore";
  }
  return msReady ? "graph" : "firestore";
}

exports.submitWaitlist = onRequest(
    {
      region: REGION,
      cors: false,
      maxInstances: 10,
      secrets: [msClientSecret],
    },
    async (req, res) => {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).set("Allow", "POST, OPTIONS").json({error: "Method not allowed"});
        return;
      }

      const body = normalizeBody(req);
      if (!body) {
        badRequest(res, "Invalid JSON body");
        return;
      }

      const honeypot = body._gotcha;
      if (honeypot !== undefined && honeypot !== null && String(honeypot).trim() !== "") {
        res.status(200).json({ok: true});
        return;
      }

      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const interest = typeof body.interest === "string" ? body.interest.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!isNonEmptyString(name) || name.length > MAX_NAME) {
        badRequest(res, "Invalid name");
        return;
      }
      if (!isNonEmptyString(email) || email.length > MAX_EMAIL) {
        badRequest(res, "Invalid email");
        return;
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        badRequest(res, "Invalid email format");
        return;
      }
      if (!ALLOWED_INTEREST.has(interest)) {
        badRequest(res, "Invalid interest selection");
        return;
      }
      if (message.length > MAX_MESSAGE) {
        badRequest(res, "Message too long");
        return;
      }

      const tenant = msTenantId.value().trim();
      const clientId = msClientId.value().trim();
      const siteId = msSiteId.value().trim();
      const listIdParam = msListId.value().trim();
      const listDisplayName = msListDisplayName.value().trim();
      const clientSecret = msClientSecret.value();

      let listIdResolved = listIdParam;
      if (!listIdResolved && listDisplayName) {
        try {
          listIdResolved = await resolveListIdByDisplayName({
            tenantId: tenant,
            clientId,
            clientSecret,
            siteId,
            displayName: listDisplayName,
          });
        } catch (err) {
          logger.error("MS_GRAPH_LIST_DISPLAY_NAME resolve failed", err.message || err);
        }
      }

      const msReady = microsoftConfigured(
          tenant,
          clientId,
          siteId,
          listIdResolved,
          clientSecret,
      );
      const primary = resolvePrimary(waitlistPrimary.value(), msReady);
      const mirrorFirestore = waitlistMirrorFirestore.value().toLowerCase() === "true";

      const graphConfig = {
        tenantId: tenant,
        clientId,
        clientSecret,
        siteId,
        listId: listIdResolved,
      };
      const payload = {name, email, interest, message};

      async function saveFirestore(extra = {}) {
        await admin.firestore().collection("waitlistSubmissions").add({
          name,
          email,
          interest,
          message: message || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "website",
          ...extra,
        });
      }

      let graphOk = false;
      let firestoreOk = false;

      async function tryMicrosoft() {
        try {
          await createWaitlistListItem(graphConfig, payload);
          graphOk = true;
        } catch (err) {
          logger.warn("Microsoft List write failed", err.message || err);
        }
      }

      async function tryFirestore(extra) {
        try {
          await saveFirestore(extra);
          firestoreOk = true;
        } catch (err) {
          logger.error("Firestore write failed", err);
        }
      }

      if (primary === "graph") {
        if (msReady) {
          await tryMicrosoft();
          if (graphOk) {
            if (mirrorFirestore) {
              await tryFirestore({mirroredFrom: "microsoft_graph"});
              if (!firestoreOk) {
                logger.warn("Firestore mirror failed after successful Graph write");
              }
            }
          } else {
            await tryFirestore({
              backupReason: "microsoft_graph_failed",
              backupDetail: "See function logs for Graph error",
            });
          }
        } else {
          await tryFirestore({storageNote: "microsoft_graph_not_configured"});
        }
      } else {
        await tryFirestore({});
        if (!firestoreOk && msReady) {
          await tryMicrosoft();
          if (!graphOk) {
            logger.error("Both Firestore and Microsoft Graph failed");
          }
        }
      }

      if (!graphOk && !firestoreOk) {
        res.status(500).json({error: "Could not save submission"});
        return;
      }

      res.status(200).json({ok: true});
    },
);
