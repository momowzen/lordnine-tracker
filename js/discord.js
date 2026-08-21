import { sendWebhook } from "./discord.js";
import { BOSSES } from "./bosses.js";

const WEBHOOK_PROXY_URL = "https://boss-tracker-webhook.arianthonyungsod.workers.dev";

async function notifyKill(boss, nextRespawnMs, tz, webhookUrl) {
  if (!webhookUrl) return;
  const next = new Date(nextRespawnMs).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz
  });
  const content = `**${boss.name}** has been defeated.\nNext respawn: ${next}`;
  await sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
}

async function notifySet(boss, nextRespawnMs, tz, webhookUrl) {
  if (!webhookUrl) return;
  const next = new Date(nextRespawnMs).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz
  });
  const content = `**${boss.name}** manually set.\nNext respawn: ${next}`;
  await sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
}

async function notifyRespawning5(boss, webhookUrl) {
  if (!webhookUrl) return;
  const content = `**${boss.name}** will respawn in 5 minutes.\nPrepare for battle!\n@here`;
  await sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
}

async function notifyRespawned(boss, webhookUrl) {
  if (!webhookUrl) return;
  const content = `**${boss.name}** has respawned!`;
  await sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
}

export { notifyKill, notifySet, notifyRespawning5, notifyRespawned };
