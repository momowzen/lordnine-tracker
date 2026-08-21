export async function sendWebhook(proxyUrl, webhookUrl, content) {
  try {
    await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl, content })
    });
  } catch (e) {
    console.error("Webhook failed:", e);
  }
}
