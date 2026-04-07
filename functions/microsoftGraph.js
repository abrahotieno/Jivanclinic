const logger = require("firebase-functions/logger");

let cachedToken = null;
let cachedExpiryMs = 0;

/**
 * Client credentials token for Microsoft Graph (app-only).
 */
async function getGraphAccessToken(tenantId, clientId, clientSecret) {
  const now = Date.now();
  if (cachedToken && cachedExpiryMs > now + 60_000) {
    return cachedToken;
  }

  const url = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.error("Microsoft Graph token request failed", {
      status: res.status,
      error: data.error,
      description: data.error_description,
    });
    throw new Error(data.error_description || data.error || "Graph token request failed");
  }

  cachedToken = data.access_token;
  cachedExpiryMs = now + (Number(data.expires_in) || 3600) * 1000;
  return cachedToken;
}

/**
 * Create a list item. siteId example: "contoso.sharepoint.com:/sites/YourSite"
 * listId: list GUID from SharePoint / Microsoft Lists.
 * fields keys must match SharePoint internal column names (Title + your custom columns).
 */
async function createListItem({tenantId, clientId, clientSecret, siteId, listId, fields}) {
  const token = await getGraphAccessToken(tenantId, clientId, clientSecret);
  const path = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(listId)}/items`;

  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({fields}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logger.error("Microsoft Graph create list item failed", {status: res.status, data});
    const msg = data.error && data.error.message ? data.error.message : JSON.stringify(data);
    throw new Error(msg || `Graph create item failed (${res.status})`);
  }
  return data;
}

/**
 * Try full field set, then Title-only line if Graph returns 4xx (wrong column names).
 */
async function createWaitlistListItem(config, {name, email, interest, message}) {
  const title = name.length > 255 ? name.slice(0, 252) + "..." : name;
  const fullFields = {
    Title: title,
    Email: email,
    Interest: interest,
    Message: message || "",
  };

  try {
    return await createListItem({...config, fields: fullFields});
  } catch (firstErr) {
    logger.warn("Graph full field set failed, retrying Title-only", firstErr.message);
    const line = [name, email, interest, message || ""].filter(Boolean).join(" | ");
    const fallbackTitle = (line || email).slice(0, 255);
    return await createListItem({
      ...config,
      fields: {Title: fallbackTitle},
    });
  }
}

module.exports = {
  getGraphAccessToken,
  createListItem,
  createWaitlistListItem,
};
