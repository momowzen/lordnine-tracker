var AppDiscord = (function () {
  var WEBHOOK_PROXY_URL = "https://lordninetracker.tadatokih.workers.dev";

  function notifyKill(boss, nextRespawnMs, tz, webhookUrl) {
    if (!webhookUrl) return Promise.resolve();
    var next = new Date(nextRespawnMs).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz
    });
    var content = "**" + boss.name + "** has been defeated.\nNext respawn: " + next;
    return AppWebhook.sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
  }

  function notifySet(boss, nextRespawnMs, tz, webhookUrl) {
    if (!webhookUrl) return Promise.resolve();
    var next = new Date(nextRespawnMs).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz
    });
    var content = "**" + boss.name + "** manually set.\nNext respawn: " + next;
    return AppWebhook.sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
  }

  function notifyRespawning5(boss, webhookUrl) {
    if (!webhookUrl) return Promise.resolve();
    var content = "**" + boss.name + "** will respawn in 5 minutes.\nPrepare for battle!\n@here";
    return AppWebhook.sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
  }

  function notifyRespawned(boss, webhookUrl) {
    if (!webhookUrl) return Promise.resolve();
    var content = "**" + boss.name + "** has respawned!";
    return AppWebhook.sendWebhook(WEBHOOK_PROXY_URL, webhookUrl, content);
  }

  return {
    notifyKill: notifyKill,
    notifySet: notifySet,
    notifyRespawning5: notifyRespawning5,
    notifyRespawned: notifyRespawned
  };
})();
