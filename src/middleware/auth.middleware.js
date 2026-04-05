const jwt = require("jsonwebtoken");

const { getDb } = require("../config/db");
const { USER_STATUS } = require("../config/constants");
const AppError = require("../utils/http-error");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authorization token is required", 401, "UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();

    const user = db.prepare("SELECT id, name, email, role, status FROM users WHERE id = ?").get(decoded.sub);

    if (!user) {
      return next(new AppError("Invalid token user", 401, "UNAUTHORIZED"));
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return next(new AppError("User account is inactive", 403, "USER_INACTIVE"));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}

module.exports = {
  authenticateToken,
};
