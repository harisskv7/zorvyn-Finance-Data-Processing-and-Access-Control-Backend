const { getDb } = require("../../config/db");

function getSummary() {
  const db = getDb();

  const result = db
    .prepare(
      `SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses,
          COUNT(*) AS record_count
       FROM financial_records
       WHERE is_deleted = 0`
    )
    .get();

  return {
    total_income: Number(result.total_income || 0),
    total_expenses: Number(result.total_expenses || 0),
    net_balance: Number(result.total_income || 0) - Number(result.total_expenses || 0),
    record_count: result.record_count,
  };
}

function getByCategory() {
  const db = getDb();

  return db
    .prepare(
      `SELECT
          category,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_amount,
          COUNT(*) AS record_count
       FROM financial_records
       WHERE is_deleted = 0
       GROUP BY category
       ORDER BY category ASC`
    )
    .all();
}

function getTrends(period) {
  const db = getDb();
  const bucketExpression = period === "weekly" ? "strftime('%Y-W%W', date)" : "strftime('%Y-%m', date)";

  return db
    .prepare(
      `SELECT
          ${bucketExpression} AS period,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) AS total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expenses,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net_amount,
          COUNT(*) AS record_count
       FROM financial_records
       WHERE is_deleted = 0
       GROUP BY period
       ORDER BY period ASC`
    )
    .all();
}

function getRecent(limit = 5) {
  const db = getDb();

  return db
    .prepare(
      `SELECT fr.id, fr.user_id, fr.amount, fr.type, fr.category, fr.date, fr.notes, fr.created_at, fr.updated_at,
              u.name AS created_by_name
       FROM financial_records fr
       JOIN users u ON u.id = fr.user_id
       WHERE fr.is_deleted = 0
       ORDER BY fr.date DESC, fr.id DESC
       LIMIT ?`
    )
    .all(limit);
}

module.exports = {
  getSummary,
  getByCategory,
  getTrends,
  getRecent,
};
