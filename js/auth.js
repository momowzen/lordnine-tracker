var AppAuth = (function () {
  var pageAuth = document.getElementById("pageAuth");
  var pageTracker = document.getElementById("pageTracker");
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");
  var loginError = document.getElementById("authError");
  var regError = document.getElementById("authError2");
  var authSuccess = document.getElementById("authSuccess");
  var showRegisterBtn = document.getElementById("showRegister");
  var showLoginBtn = document.getElementById("showLogin");
  var logoutBtn = document.getElementById("logoutBtn");
  var regTimezone = document.getElementById("regTimezone");

  var currentUser = null;
  var userProfile = null;

  AppUtils.populateTimezones(regTimezone, Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tokyo");

  showRegisterBtn.addEventListener("click", function () {
    loginForm.hidden = true;
    registerForm.hidden = false;
    loginError.textContent = "";
    authSuccess.textContent = "";
  });

  showLoginBtn.addEventListener("click", function () {
    registerForm.hidden = true;
    loginForm.hidden = false;
    regError.textContent = "";
    authSuccess.textContent = "";
  });

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;
    console.log("[AUTH] Attempting login with:", email);
    auth.signInWithEmailAndPassword(email, password).then(function (cred) {
      console.log("[AUTH] Login success:", cred.user.uid);
    }).catch(function (err) {
      console.error("[AUTH] Login error:", err.code, err.message);
      loginError.textContent = err.message.replace("Firebase: ", "");
    });
  });

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    regError.textContent = "";
    authSuccess.textContent = "";
    var email = document.getElementById("regEmail").value.trim();
    var password = document.getElementById("regPassword").value;
    var timezone = document.getElementById("regTimezone").value;
    if (password.length < 6) {
      regError.textContent = "Password must be at least 6 characters.";
      return;
    }
    console.log("[AUTH] Attempting registration with:", email);
    auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      console.log("[AUTH] User created:", cred.user.uid, "writing profile...");
      return db.collection("users").doc(cred.user.uid).set({
        email: email,
        timezone: timezone,
        webhookUrl: "",
        createdAt: Date.now()
      });
    }).then(function () {
      console.log("[AUTH] Profile written, showing success");
      authSuccess.textContent = "Account created! Logging in...";
    }).catch(function (err) {
      console.error("[AUTH] Registration error:", err.code, err.message);
      regError.textContent = err.message.replace("Firebase: ", "");
    });
  });

  function loadProfile(uid) {
    return db.collection("users").doc(uid).get().then(function (snap) {
      if (snap.exists) {
        userProfile = Object.assign({ id: uid }, snap.data());
      } else {
        userProfile = { id: uid, email: "", timezone: "Asia/Tokyo", webhookUrl: "" };
      }
      return userProfile;
    }).catch(function (err) {
      console.warn("Firestore read failed, using defaults:", err);
      userProfile = { id: uid, email: "", timezone: "Asia/Tokyo", webhookUrl: "" };
      return userProfile;
    });
  }

  function initAuth(onReady) {
    auth.onAuthStateChanged(function (user) {
      console.log("[AUTH] Auth state changed:", user ? user.uid : "null");
      if (user) {
        currentUser = user;
        console.log("[AUTH] Loading profile for:", user.uid);
        loadProfile(user.uid).then(function (profile) {
          console.log("[AUTH] Profile loaded, showing tracker");
          pageAuth.hidden = true;
          pageTracker.hidden = false;
          onReady(user, profile);
        });
      } else {
        currentUser = null;
        userProfile = null;
        pageAuth.hidden = false;
        pageTracker.hidden = true;
      }
    });
  }

  logoutBtn.addEventListener("click", function () { auth.signOut(); });

  return {
    initAuth: initAuth,
    loadProfile: loadProfile,
    currentUser: function () { return currentUser; },
    userProfile: function () { return userProfile; }
  };
})();
