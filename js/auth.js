import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const IANA_TIMEZONES = [
  "Pacific/Midway","Pacific/Pago_Pago","Pacific/Honolulu","America/Anchorage",
  "America/Los_Angeles","America/Denver","America/Chicago","America/New_York",
  "America/Caracas","America/Halifax","America/St_Johns","America/Sao_Paulo",
  "Atlantic/South_Georgia","Atlantic/Azores","Europe/London","Europe/Paris",
  "Europe/Berlin","Europe/Athens","Europe/Istanbul","Africa/Cairo",
  "Africa/Nairobi","Asia/Dubai","Asia/Karachi","Asia/Kolkata",
  "Asia/Dhaka","Asia/Bangkok","Asia/Shanghai","Asia/Tokyo",
  "Asia/Seoul","Australia/Sydney","Pacific/Auckland","Pacific/Fiji"
];

const pageAuth = document.getElementById("pageAuth");
const pageTracker = document.getElementById("pageTracker");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("authError");
const regError = document.getElementById("authError2");
const authSuccess = document.getElementById("authSuccess");
const showRegisterBtn = document.getElementById("showRegister");
const showLoginBtn = document.getElementById("showLogin");
const logoutBtn = document.getElementById("logoutBtn");
const regTimezone = document.getElementById("regTimezone");

let currentUser = null;
let userProfile = null;

function populateTimezones(selectEl, current) {
  selectEl.innerHTML = "";
  for (const tz of IANA_TIMEZONES) {
    const opt = document.createElement("option");
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, " ");
    if (tz === current) opt.selected = true;
    selectEl.appendChild(opt);
  }
}

populateTimezones(regTimezone, Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo");

showRegisterBtn.addEventListener("click", () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
  loginError.textContent = "";
  authSuccess.textContent = "";
});

showLoginBtn.addEventListener("click", () => {
  registerForm.hidden = true;
  loginForm.hidden = false;
  regError.textContent = "";
  authSuccess.textContent = "";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = err.message.replace("Firebase: ", "");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  regError.textContent = "";
  authSuccess.textContent = "";
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const timezone = document.getElementById("regTimezone").value;
  if (password.length < 6) {
    regError.textContent = "Password must be at least 6 characters.";
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      timezone,
      webhookUrl: "",
      createdAt: Date.now()
    });
    authSuccess.textContent = "Account created! Logging in...";
  } catch (err) {
    regError.textContent = err.message.replace("Firebase: ", "");
  }
});

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    userProfile = { id: uid, ...snap.data() };
  } else {
    userProfile = { id: uid, email: "", timezone: "Asia/Tokyo", webhookUrl: "" };
  }
  return userProfile;
}

function initAuth(onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await loadProfile(user.uid);
      pageAuth.hidden = true;
      pageTracker.hidden = false;
      onReady(user, userProfile);
    } else {
      currentUser = null;
      userProfile = null;
      pageAuth.hidden = false;
      pageTracker.hidden = true;
    }
  });
}

logoutBtn.addEventListener("click", () => signOut(auth));

export { initAuth, currentUser, userProfile, loadProfile, auth, db };
