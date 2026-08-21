export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { webhookUrl, content } = await request.json();

      if (!webhookUrl || !content) {
        return new Response(JSON.stringify({ error: "Missing webhookUrl or content" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
          !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
        return new Response(JSON.stringify({ error: "Invalid webhook URL" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      return new Response(JSON.stringify({ ok: resp.ok, status: resp.status }), {
        status: resp.ok ? 200 : resp.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
