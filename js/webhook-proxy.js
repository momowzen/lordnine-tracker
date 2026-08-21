var AppWebhook = (function () {
  function sendWebhook(proxyUrl, webhookUrl, content) {
    return fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl: webhookUrl, content: content })
    }).catch(function (e) {
      console.error("Webhook failed:", e);
    });
  }

  return { sendWebhook: sendWebhook };
})();
