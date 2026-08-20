export default function adminMiddleware(req, res, next) {
  const adminPhones =
    process.env.ADMIN_PHONES?.split(",").map(p => p.trim()) || [];

  if (!req.user || !req.user.phone) {
    return res.status(403).json({ message: "Admin access denied" });
  }

  // 🔑 Normalize phone (remove +91 if exists)
  const userPhone = req.user.phone.replace("+91", "").trim();

  if (!adminPhones.includes(userPhone)) {
    return res.status(403).json({ message: "Admin access denied" });
  }

  next();
}
