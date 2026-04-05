const { getDb } = require("../../config/db");
const { ROLES, USER_STATUS } = require("../../config/constants");
const { buildPagination, buildMeta } = require("../../utils/pagination");
const AppError = require("../../utils/http-error");

function listUsers(query) {
  const db = getDb();
  const { page, limit, role, status, search } = query;
  const { offset } = buildPagination(page, limit);

  const filters = [];
  const params = [];

  if (role) {
    filters.push("role = ?");
    params.push(role);
  }

  if (status) {
    filters.push("status = ?");
    params.push(status);
  }

  if (search) {
    filters.push("(name LIKE ? OR email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params).count;

  const users = db
    .prepare(
      `SELECT id, name, email, role, status, created_at
       FROM users
       ${whereClause}
       ORDER BY id ASC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    users,
    pagination: buildMeta(total, page, limit),
  };
}

function getUserById(id) {
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?").get(id);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return user;
}

function updateUserRole(id, role) {
  const db = getDb();
  const result = db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);

  if (result.changes === 0) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return getUserById(id);
}

function updateUserStatus(id, status, actorId) {
  const db = getDb();
  const targetUser = db.prepare("SELECT id, role, status FROM users WHERE id = ?").get(id);

  if (!targetUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (targetUser.status === status) {
    return getUserById(id);
  }

  if (targetUser.id === actorId && status === USER_STATUS.INACTIVE) {
    throw new AppError("You cannot deactivate your own account", 400, "SELF_DEACTIVATION_NOT_ALLOWED");
  }

  if (targetUser.role === ROLES.ADMIN && targetUser.status === USER_STATUS.ACTIVE && status === USER_STATUS.INACTIVE) {
    const activeAdminCount = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = ? AND status = ?")
      .get(ROLES.ADMIN, USER_STATUS.ACTIVE).count;

    if (activeAdminCount <= 1) {
      throw new AppError("At least one active admin account must remain", 400, "LAST_ADMIN_DEACTIVATION_NOT_ALLOWED");
    }
  }

  const result = db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
  if (result.changes === 0) {
    throw new AppError("User status update failed", 500, "USER_STATUS_UPDATE_FAILED");
  }

  return getUserById(id);
}

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
};
