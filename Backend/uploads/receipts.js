import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads", "receipts");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
