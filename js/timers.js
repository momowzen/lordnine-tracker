import { db } from "./firebase-config.js";
import {
  collection, doc, getDocs, setDoc, onSnapshot
} from "firebase/firestore";
import { BOSSES } from "./bosses.js";

let timers = {};
let unsubscribeTimers = null;

function listenUserTimers(uid, onUpdate) {
  if (unsubscribeTimers) unsubscribeTimers();
  const timersRef = collection(db, "users", uid, "timers");
  unsubscribeTimers = onSnapshot(timersRef, (snap) => {
    const t = {};
    snap.forEach(d => { t[d.id] = d.data(); });
    timers = t;
    onUpdate(timers);
  });
}

function getTimers() { return timers; }

async function setTimer(uid, bossId, data) {
  const ref = doc(db, "users", uid, "timers", bossId);
  await setDoc(ref, data, { merge: true });
}

async function loadAllTimers(uid) {
  const snap = await getDocs(collection(db, "users", uid, "timers"));
  const t = {};
  snap.forEach(d => { t[d.id] = d.data(); });
  timers = t;
  return timers;
}

async function initTimers(uid, onUpdate) {
  await loadAllTimers(uid);
  listenUserTimers(uid, onUpdate);
}

export { initTimers, getTimers, setTimer, timers };
