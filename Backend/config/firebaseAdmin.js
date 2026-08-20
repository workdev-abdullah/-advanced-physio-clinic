import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(
  process.cwd(),
  "config",
  "serviceAccountKey.json"
);

// 🔐 initialize ONLY ONCE
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized");
}

export default admin;
