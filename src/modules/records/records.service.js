const { getDb } = require("../../config/db");
const { buildPagination, buildMeta } = require("../../utils/pagination");
const AppError = require("../../utils/http-error");

function ensureUserExists(userId) {
  const db = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);

  if (!user) {
    throw new AppError("Creator user does not exist", 400, "INVALID_USER_ID");
  }
}

function getRecordById(recordId) {
  const db = getDb();

  const record = db
    .prepare(
      `SELECT fr.id, fr.user_id, fr.amount, fr.type, fr.category, fr.date, fr.notes, fr.is_deleted, fr.created_at, fr.updated_at,
              u.name AS created_by_name
       FROM financial_records fr
       JOIN users u ON u.id = fr.user_id
       WHERE fr.id = ? AND fr.is_deleted = 0`
    )
    .get(recordId);

  if (!record) {
    throw new AppError("Financial record not found", 404, "RECORD_NOT_FOUND");
  }

  return record;
}

function createRecord(payload, actorId) {
  const db = getDb();
  const userId = payload.user_id || actorId;

  ensureUserExists(userId);

  const result = db
    .prepare(
      `INSERT INTO financial_records (user_id, amount, type, category, date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(userId, payload.amount, payload.type, payload.category, payload.date, payload.notes || null);

  return getRecordById(result.lastInsertRowid);
}

function listRecords(query, requesterRole) {
  const db = getDb();
  const { type, category, from, to, page, limit } = query;

  if (requesterRole === "viewer") {
    throw new AppError("Viewer role cannot access financial records", 403, "RECORDS_ACCESS_FORBIDDEN");
  }

  const filters = ["fr.is_deleted = 0"];
  const params = [];

  if (type) {
    filters.push("fr.type = ?");
    params.push(type);
  }

  if (category) {
    filters.push("fr.category = ?");
    params.push(category);
  }

  if (from) {
    filters.push("fr.date >= ?");
    params.push(from);
  }

  if (to) {
    filters.push("fr.date <= ?");
    params.push(to);
  }

  const whereClause = `WHERE ${filters.join(" AND ")}`;
  const { offset } = buildPagination(page, limit);

  const total = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM financial_records fr
       ${whereClause}`
    )
    .get(...params).count;

  const records = db
    .prepare(
      `SELECT fr.id, fr.user_id, fr.amount, fr.type, fr.category, fr.date, fr.notes, fr.created_at, fr.updated_at,
              u.name AS created_by_name
       FROM financial_records fr
       JOIN users u ON u.id = fr.user_id
       ${whereClause}
       ORDER BY fr.date DESC, fr.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return {
    records,
    pagination: buildMeta(total, page, limit),
  };
}

function updateRecord(recordId, payload) {
  const db = getDb();

  const updates = [];
  const params = [];

  const allowedFields = ["amount", "type", "category", "date", "notes"];
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      updates.push(`${field} = ?`);
      params.push(payload[field]);
    }
  });

  updates.push("updated_at = datetime('now')");
  params.push(recordId);

  const result = db
    .prepare(
      `UPDATE financial_records
       SET ${updates.join(", ")}
       WHERE id = ? AND is_deleted = 0`
    )
    .run(...params);

  if (result.changes === 0) {
    throw new AppError("Financial record not found", 404, "RECORD_NOT_FOUND");
  }

  return getRecordById(recordId);
}

function softDeleteRecord(recordId) {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE financial_records
       SET is_deleted = 1,
           updated_at = datetime('now')
       WHERE id = ? AND is_deleted = 0`
    )
    .run(recordId);

  if (result.changes === 0) {
    throw new AppError("Financial record not found", 404, "RECORD_NOT_FOUND");
  }
}

module.exports = {
  getRecordById,
  createRecord,
  listRecords,
  updateRecord,
  softDeleteRecord,
};
