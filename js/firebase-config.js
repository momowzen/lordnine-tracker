import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVczIYCa4rlJho6MfpDiGdjMye2oltxwU",
  authDomain: "public-boss-tracker.firebaseapp.com",
  projectId: "public-boss-tracker",
  storageBucket: "public-boss-tracker.firebasestorage.app",
  messagingSenderId: "1030224765263",
  appId: "1:1030224765263:web:9fab926622c91e3266253a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
