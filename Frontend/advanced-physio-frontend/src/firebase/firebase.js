// src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCaJxNi7oICv6GzVAqESlwAtUvMb_0ltZY",
  authDomain: "clinic-f96f0.firebaseapp.com",
  projectId: "clinic-f96f0",
  storageBucket: "clinic-f96f0.firebasestorage.app",
  messagingSenderId: "778011884627",
  appId: "1:778011884627:web:bd22911e6a54a7781cdaa6",
  measurementId: "G-GT5SMHZ5NK",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

console.log("🔥 Firebase project:", auth.app.options.projectId);
console.log(
  "🔥 Firebase authDomain:",
  auth.app.options.authDomain
);