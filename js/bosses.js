const BOSSES = [
  {id:"Venatus",name:"Venatus",lvl:60,rs:36000},
  {id:"Viorent",name:"Viorent",lvl:65,rs:36000},
  {id:"Ego",name:"Ego",lvl:70,rs:75600},
  {id:"Clemantis",name:"Clemantis",lvl:70,wr:[{d:1,h:12,m:30},{d:4,h:20,m:0}]},
  {id:"Livera",name:"Livera",lvl:75,rs:86400},
  {id:"Araneo",name:"Araneo",lvl:75,rs:86400},
  {id:"Undomiel",name:"Undomiel",lvl:80,rs:86400},
  {id:"Saphirus",name:"Saphirus",lvl:80,wr:[{d:0,h:18,m:0},{d:2,h:12,m:30}]},
  {id:"Neutro",name:"Neutro",lvl:80,wr:[{d:2,h:20,m:0},{d:4,h:12,m:30}]},
  {id:"LadyDalia",name:"Lady Dalia",lvl:85,rs:64800},
  {id:"GeneralAquleus",name:"General Aquleus",lvl:85,rs:104400},
  {id:"Thymele",name:"Thymele",lvl:85,wr:[{d:1,h:20,m:0},{d:3,h:12,m:30}]},
  {id:"Amentis",name:"Amentis",lvl:88,rs:104400},
  {id:"BaronBraudmore",name:"Baron Braudmore",lvl:88,rs:115200},
  {id:"Milavy",name:"Milavy",lvl:90,wr:[{d:6,h:16,m:0}]},
  {id:"Wannitas",name:"Wannitas",lvl:93,rs:172800},
  {id:"Metus",name:"Metus",lvl:93,rs:172800},
  {id:"Duplican",name:"Duplican",lvl:93,rs:172800},
  {id:"Shuliar",name:"Shuliar",lvl:95,rs:126000},
  {id:"Ringor",name:"Ringor",lvl:95,wr:[{d:6,h:18,m:0}]},
  {id:"Roderick",name:"Roderick",lvl:95,wr:[{d:5,h:20,m:0}]},
  {id:"Gareth",name:"Gareth",lvl:98,rs:115200},
  {id:"Titore",name:"Titore",lvl:98,rs:133200},
  {id:"Larba",name:"Larba",lvl:98,rs:126000},
  {id:"Catena",name:"Catena",lvl:100,rs:126000},
  {id:"Auraq",name:"Auraq",lvl:100,wr:[{d:5,h:23,m:0},{d:3,h:22,m:0}]},
  {id:"Secreta",name:"Secreta",lvl:100,rs:223200},
  {id:"Ordo",name:"Ordo",lvl:100,rs:223200},
  {id:"Asta",name:"Asta",lvl:100,rs:223200},
  {id:"Supore",name:"Supore",lvl:100,rs:223200},
  {id:"Chaiflock",name:"Chaiflock",lvl:120,wr:[{d:0,h:16,m:0}]},
  {id:"Benji",name:"Benji",lvl:120,wr:[{d:0,h:22,m:0}]},
  {id:"Libitina",name:"Libitina",lvl:130,wr:[{d:1,h:22,m:0},{d:6,h:22,m:0}]},
  {id:"Rakajeth",name:"Rakajeth",lvl:130,wr:[{d:2,h:23,m:0},{d:0,h:20,m:0}]},
  {id:"Icaruthia",name:"Icaruthia",lvl:135,wr:[{d:2,h:22,m:0},{d:5,h:22,m:0}]},
  {id:"Motti",name:"Motti",lvl:135,wr:[{d:3,h:20,m:0},{d:6,h:20,m:0}]},
  {id:"Camalia",name:"Camalia",lvl:135,wr:[{d:4,h:22,m:0}]},
  {id:"Nevaeh",name:"Nevaeh",lvl:140,wr:[{d:0,h:23,m:0}]},
  {id:"Tumier",name:"Tumier",lvl:140,wr:[{d:0,h:20,m:0}]},
  {id:"Lucus",name:"Lucus",lvl:145,wr:[{d:6,h:23,m:0}]}
];

function nextSpawnSchedule(b, baseMs, tz) {
  if (!b.wr) return null;
  const offset = getTzOffsetMs(tz);
  const base = new Date(baseMs + offset);
  let best = null;
  for (const w of b.wr) {
    const c = new Date(base);
    const del = (w.d + 7 - base.getUTCDay()) % 7;
    c.setUTCDate(base.getUTCDate() + del);
    c.setUTCHours(w.h, w.m, 0, 0);
    let r = c.getTime() - offset;
    if (r <= baseMs) r += 604800000;
    if (!best || r < best) best = r;
  }
  return best ? new Date(best) : null;
}

function prevSpawnSchedule(b, baseMs, tz) {
  if (!b.wr) return null;
  const offset = getTzOffsetMs(tz);
  const base = new Date(baseMs + offset);
  let best = null;
  for (const w of b.wr) {
    const c = new Date(base);
    const del = (w.d + 7 - base.getUTCDay()) % 7;
    c.setUTCDate(base.getUTCDate() + del);
    c.setUTCHours(w.h, w.m, 0, 0);
    let r = c.getTime() - offset;
    if (r > baseMs) r -= 604800000;
    if (!best || r > best) best = r;
  }
  return best ? new Date(best) : null;
}

function nextSpawnAt(b, timers, baseMs, tz) {
  if (b.rs) {
    const t = timers[b.id];
    return t?.endTime ? new Date(t.endTime) : null;
  }
  if (b.wr) return nextSpawnSchedule(b, baseMs, tz);
  return null;
}

function intBosses() { return BOSSES.filter(b => b.rs); }
function schedBosses() { return BOSSES.filter(b => b.wr); }
function grpInterval() {
  const g = {};
  for (const b of intBosses()) {
    const k = b.rs;
    if (!g[k]) g[k] = { s: k, b: [] };
    g[k].b.push(b);
  }
  return Object.values(g).sort((a, b) => a.s - b.s);
}

const SCHED_SPAWN_EXPIRE_MS = 120000;

export {
  BOSSES, nextSpawnAt, nextSpawnSchedule, prevSpawnSchedule,
  intBosses, schedBosses, grpInterval, SCHED_SPAWN_EXPIRE_MS
};
