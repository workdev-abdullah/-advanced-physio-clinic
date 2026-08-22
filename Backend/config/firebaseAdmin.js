// Backend/config/firebaseAdmin.js

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  let credential;

  // ==================================================
  // PRODUCTION / RENDER
  // Uses environment variables when available
  // ==================================================

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    console.log(
      "🔥 Firebase Admin: using environment variables"
    );
  }

  // ==================================================
  // LOCAL DEVELOPMENT
  // Falls back to serviceAccountKey.json
  // ==================================================

  else {
    const serviceAccountPath = path.join(
      process.cwd(),
      "config",
      "serviceAccountKey.json"
    );

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Firebase service account file not found: ${serviceAccountPath}`
      );
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    credential = admin.credential.cert(serviceAccount);

    console.log(
      "🔥 Firebase Admin: using local serviceAccountKey.json"
    );
  }

  // ==================================================
  // INITIALIZE FIREBASE ADMIN
  // ==================================================

  admin.initializeApp({
    credential,
  });

  console.log("✅ Firebase Admin initialized");

  // Helpful verification
  console.log(
    "🔥 Firebase Admin project:",
    admin.app().options.credential?.projectId ||
      process.env.FIREBASE_PROJECT_ID ||
      "unknown"
  );
}

export default admin;