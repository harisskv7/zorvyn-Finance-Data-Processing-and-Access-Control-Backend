const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { getDb } = require("../../config/db");
const { ROLES, USER_STATUS } = require("../../config/constants");
const AppError = require("../../utils/http-error");

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

function toSafeUser(userRow) {
  return {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    status: userRow.status,
    created_at: userRow.created_at,
  };
}

function registerUser(payload) {
  const db = getDb();

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(payload.email);
  if (existingUser) {
    throw new AppError("Email is already registered", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = bcrypt.hashSync(payload.password, saltRounds);

  const insertResult = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(payload.name, payload.email, passwordHash, ROLES.VIEWER, USER_STATUS.ACTIVE);

  const createdUser = db
    .prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?")
    .get(insertResult.lastInsertRowid);

  return toSafeUser(createdUser);
}

function loginUser(payload) {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500, "JWT_SECRET_MISSING");
  }

  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, name, email, password_hash, role, status, created_at
       FROM users
       WHERE email = ?`
    )
    .get(payload.email);

  if (!user || !bcrypt.compareSync(payload.password, user.password_hash)) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError("User account is inactive", 403, "USER_INACTIVE");
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  return {
    token,
    user: toSafeUser(user),
  };
}

module.exports = {
  registerUser,
  loginUser,
};
