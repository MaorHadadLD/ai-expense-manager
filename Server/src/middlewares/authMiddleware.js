// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👈 כאן חייב להיות userId כי ככה בנית את ה־JWT
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    console.log("🔹 authMiddleware decoded:", decoded);
    next();
  } catch (err) {
    console.error("❌ authMiddleware error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
