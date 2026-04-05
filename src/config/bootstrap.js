const bcrypt = require("bcryptjs");

const { getDb } = require("./db");
const { ROLES, USER_STATUS } = require("./constants");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const defaultUsers = [
  {
    name: "System Admin",
    email: process.env.DEMO_ADMIN_EMAIL || "admin@zorvyn.com",
    password: process.env.DEMO_ADMIN_PASSWORD || "Admin@123",
    role: ROLES.ADMIN,
  },
  {
    name: "Data Analyst",
    email: process.env.DEMO_ANALYST_EMAIL || "analyst@zorvyn.com",
    password: process.env.DEMO_ANALYST_PASSWORD || "Analyst@123",
    role: ROLES.ANALYST,
  },
  {
    name: "Read Only Viewer",
    email: process.env.DEMO_VIEWER_EMAIL || "viewer@zorvyn.com",
    password: process.env.DEMO_VIEWER_PASSWORD || "Viewer@123",
    role: ROLES.VIEWER,
  },
];

const defaultRecords = [
  { amount: 4200, type: "income", category: "salary", date: "2025-01-05", notes: "January salary" },
  { amount: 450, type: "expense", category: "rent", date: "2025-01-08", notes: "Office rent share" },
  { amount: 180, type: "expense", category: "utilities", date: "2025-01-12", notes: "Electricity" },
  { amount: 700, type: "income", category: "freelance", date: "2025-02-01", notes: "Freelance payout" },
  { amount: 220, type: "expense", category: "internet", date: "2025-02-04", notes: "ISP bill" },
  { amount: 3900, type: "income", category: "salary", date: "2025-02-05", notes: "February salary" },
];

function ensureDemoData() {
  const db = getDb();
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

  if (userCount > 0) {
    return { seeded: false };
  }

  const insertUserStmt = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?)`
  );

  const insertRecordStmt = db.prepare(
    `INSERT INTO financial_records (user_id, amount, type, category, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    const createdUserIds = {};

    defaultUsers.forEach((user) => {
      const passwordHash = bcrypt.hashSync(user.password, SALT_ROUNDS);
      const result = insertUserStmt.run(user.name, user.email, passwordHash, user.role, USER_STATUS.ACTIVE);
      createdUserIds[user.role] = result.lastInsertRowid;
    });

    defaultRecords.forEach((record, index) => {
      const creatorId = index % 2 === 0 ? createdUserIds[ROLES.ADMIN] : createdUserIds[ROLES.ANALYST];
      insertRecordStmt.run(creatorId, record.amount, record.type, record.category, record.date, record.notes);
    });
  });

  tx();
  return { seeded: true };
}

module.exports = {
  ensureDemoData,
};
