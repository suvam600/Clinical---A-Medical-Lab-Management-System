// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Backward compatible: accept userId OR id OR _id
    const userId = decoded.userId || decoded.id || decoded._id;

    req.user = {
      ...decoded,
      userId, // always available from now on
    };

    if (!req.user.userId) {
      return res.status(401).json({
        message: "Token payload missing userId.",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role." });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };
