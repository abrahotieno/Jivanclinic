const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const REGION = "europe-west1";

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

exports.submitWaitlist = onRequest(
    {
      region: REGION,
      cors: false,
      maxInstances: 10,
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

      try {
        await admin.firestore().collection("waitlistSubmissions").add({
          name,
          email,
          interest,
          message: message || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          source: "website",
        });
      } catch (err) {
        logger.error("waitlist write failed", err);
        res.status(500).json({error: "Could not save submission"});
        return;
      }

      res.status(200).json({ok: true});
    },
);
