var AppBosses = (function () {
  var BOSSES = [
    {id:"Venatus",name:"Venatus",lvl:60,rs:36000},
    {id:"Viorent",name:"Viorent",lvl:65,rs:36000},
    {id:"Ego",name:"Ego",lvl:70,rs:75600},
    {id:"Clemantis",name:"Clemantis",lvl:70,wr:[{d:1,h:3,m:30},{d:4,h:11,m:0}]},
    {id:"Livera",name:"Livera",lvl:75,rs:86400},
    {id:"Araneo",name:"Araneo",lvl:75,rs:86400},
    {id:"Undomiel",name:"Undomiel",lvl:80,rs:86400},
    {id:"Saphirus",name:"Saphirus",lvl:80,wr:[{d:0,h:9,m:0},{d:2,h:3,m:30}]},
    {id:"Neutro",name:"Neutro",lvl:80,wr:[{d:2,h:11,m:0},{d:4,h:3,m:30}]},
    {id:"LadyDalia",name:"Lady Dalia",lvl:85,rs:64800},
    {id:"GeneralAquleus",name:"General Aquleus",lvl:85,rs:104400},
    {id:"Thymele",name:"Thymele",lvl:85,wr:[{d:1,h:11,m:0},{d:3,h:3,m:30}]},
    {id:"Amentis",name:"Amentis",lvl:88,rs:104400},
    {id:"BaronBraudmore",name:"Baron Braudmore",lvl:88,rs:115200},
    {id:"Milavy",name:"Milavy",lvl:90,wr:[{d:6,h:7,m:0}]},
    {id:"Wannitas",name:"Wannitas",lvl:93,rs:172800},
    {id:"Metus",name:"Metus",lvl:93,rs:172800},
    {id:"Duplican",name:"Duplican",lvl:93,rs:172800},
    {id:"Shuliar",name:"Shuliar",lvl:95,rs:126000},
    {id:"Ringor",name:"Ringor",lvl:95,wr:[{d:6,h:9,m:0}]},
    {id:"Roderick",name:"Roderick",lvl:95,wr:[{d:5,h:11,m:0}]},
    {id:"Gareth",name:"Gareth",lvl:98,rs:115200},
    {id:"Titore",name:"Titore",lvl:98,rs:133200},
    {id:"Larba",name:"Larba",lvl:98,rs:126000},
    {id:"Catena",name:"Catena",lvl:100,rs:126000},
    {id:"Auraq",name:"Auraq",lvl:100,wr:[{d:5,h:14,m:0},{d:3,h:13,m:0}]},
    {id:"Secreta",name:"Secreta",lvl:100,rs:223200},
    {id:"Ordo",name:"Ordo",lvl:100,rs:223200},
    {id:"Asta",name:"Asta",lvl:100,rs:223200},
    {id:"Supore",name:"Supore",lvl:100,rs:223200},
    {id:"Chaiflock",name:"Chaiflock",lvl:120,wr:[{d:0,h:7,m:0}]},
    {id:"Benji",name:"Benji",lvl:120,wr:[{d:0,h:13,m:0}]},
    {id:"Libitina",name:"Libitina",lvl:130,wr:[{d:1,h:13,m:0},{d:6,h:13,m:0}]},
    {id:"Rakajeth",name:"Rakajeth",lvl:130,wr:[{d:2,h:14,m:0},{d:0,h:11,m:0}]},
    {id:"Icaruthia",name:"Icaruthia",lvl:135,wr:[{d:2,h:13,m:0},{d:5,h:13,m:0}]},
    {id:"Motti",name:"Motti",lvl:135,wr:[{d:3,h:11,m:0},{d:6,h:11,m:0}]},
    {id:"Camalia",name:"Camalia",lvl:135,wr:[{d:4,h:13,m:0}]},
    {id:"Nevaeh",name:"Nevaeh",lvl:140,wr:[{d:0,h:14,m:0}]},
    {id:"Tumier",name:"Tumier",lvl:140,wr:[{d:0,h:11,m:0}]},
    {id:"Lucus",name:"Lucus",lvl:145,wr:[{d:6,h:14,m:0}]}
  ];

  var SCHED_SPAWN_EXPIRE_MS = 120000;

  function nextSpawnSchedule(b, baseMs) {
    if (!b.wr) return null;
    var best = null;
    for (var i = 0; i < b.wr.length; i++) {
      var w = b.wr[i];
      var c = new Date(baseMs);
      var del = (w.d + 7 - c.getUTCDay()) % 7;
      c.setUTCDate(c.getUTCDate() + del);
      c.setUTCHours(w.h, w.m, 0, 0);
      var r = c.getTime();
      if (r <= baseMs) r += 604800000;
      if (!best || r < best) best = r;
    }
    return best ? new Date(best) : null;
  }

  function prevSpawnSchedule(b, baseMs) {
    if (!b.wr) return null;
    var best = null;
    for (var i = 0; i < b.wr.length; i++) {
      var w = b.wr[i];
      var c = new Date(baseMs);
      var del = (w.d + 7 - c.getUTCDay()) % 7;
      c.setUTCDate(c.getUTCDate() + del);
      c.setUTCHours(w.h, w.m, 0, 0);
      var r = c.getTime();
      if (r > baseMs) r -= 604800000;
      if (!best || r > best) best = r;
    }
    return best ? new Date(best) : null;
  }

  function nextSpawnAt(b, timers, baseMs, tz) {
    if (b.rs) {
      var t = timers[b.id];
      return (t && t.endTime) ? new Date(t.endTime) : null;
    }
    if (b.wr) return nextSpawnSchedule(b, baseMs);
    return null;
  }

  function convertWrToTz(wrEntry, tz) {
    var now = new Date();
    var c = new Date(now.getTime());
    c.setUTCHours(0, 0, 0, 0);
    var del = (wrEntry.d + 7 - c.getUTCDay()) % 7;
    c.setUTCDate(c.getUTCDate() + del);
    c.setUTCHours(wrEntry.h, wrEntry.m, 0, 0);
    var utcMs = c.getTime();
    if (utcMs <= now.getTime()) utcMs += 604800000;
    var offset = AppUtils.getTzOffsetMs(tz);
    var local = new Date(utcMs + offset);
    return { d: local.getUTCDay(), h: local.getUTCHours(), m: local.getUTCMinutes() };
  }

  function intBosses() { return BOSSES.filter(function (b) { return b.rs; }); }
  function schedBosses() { return BOSSES.filter(function (b) { return b.wr; }); }
  function grpInterval() {
    var g = {};
    var ib = intBosses();
    for (var i = 0; i < ib.length; i++) {
      var k = ib[i].rs;
      if (!g[k]) g[k] = { s: k, b: [] };
      g[k].b.push(ib[i]);
    }
    return Object.values(g).sort(function (a, b) { return a.s - b.s; });
  }

  function p2(n) { return String(n).padStart(2, "0"); }

  return {
    BOSSES: BOSSES,
    SCHED_SPAWN_EXPIRE_MS: SCHED_SPAWN_EXPIRE_MS,
    nextSpawnAt: nextSpawnAt,
    nextSpawnSchedule: nextSpawnSchedule,
    prevSpawnSchedule: prevSpawnSchedule,
    convertWrToTz: convertWrToTz,
    intBosses: intBosses,
    schedBosses: schedBosses,
    grpInterval: grpInterval,
    p2: p2
  };
})();
