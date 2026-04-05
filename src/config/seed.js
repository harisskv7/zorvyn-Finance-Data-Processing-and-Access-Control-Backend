require("dotenv").config();

const bcrypt = require("bcryptjs");

const { initializeDatabase } = require("./db");
const { ROLES, USER_STATUS } = require("./constants");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const demoUsers = [
  {
    name: "System Admin",
    email: "admin@zorvyn.com",
    password: "Admin@123",
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
  },
  {
    name: "Data Analyst",
    email: "analyst@zorvyn.com",
    password: "Analyst@123",
    role: ROLES.ANALYST,
    status: USER_STATUS.ACTIVE,
  },
  {
    name: "Read Only Viewer",
    email: "viewer@zorvyn.com",
    password: "Viewer@123",
    role: ROLES.VIEWER,
    status: USER_STATUS.ACTIVE,
  },
];

const demoRecords = [
  { amount: 4200, type: "income", category: "salary", date: "2025-01-05", notes: "January salary" },
  { amount: 450, type: "expense", category: "rent", date: "2025-01-08", notes: "Office rent share" },
  { amount: 180, type: "expense", category: "utilities", date: "2025-01-12", notes: "Electricity" },
  { amount: 700, type: "income", category: "freelance", date: "2025-02-01", notes: "Freelance payout" },
  { amount: 220, type: "expense", category: "internet", date: "2025-02-04", notes: "ISP bill" },
  { amount: 3900, type: "income", category: "salary", date: "2025-02-05", notes: "February salary" },
  { amount: 560, type: "expense", category: "equipment", date: "2025-02-10", notes: "New monitor" },
  { amount: 800, type: "income", category: "bonus", date: "2025-03-02", notes: "Quarterly bonus" },
  { amount: 4100, type: "income", category: "salary", date: "2025-03-05", notes: "March salary" },
  { amount: 620, type: "expense", category: "marketing", date: "2025-03-11", notes: "Campaign spend" },
  { amount: 275, type: "expense", category: "subscriptions", date: "2025-03-15", notes: "SaaS tools" },
  { amount: 950, type: "income", category: "consulting", date: "2025-03-20", notes: "Consulting fee" },
];

function seed() {
  const db = initializeDatabase();

  const insertUserStmt = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?)`
  );

  const insertRecordStmt = db.prepare(
    `INSERT INTO financial_records (user_id, amount, type, category, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const runSeed = db.transaction(() => {
    db.prepare("DELETE FROM financial_records").run();
    db.prepare("DELETE FROM users").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'financial_records'").run();

    const createdUsers = {};

    demoUsers.forEach((user) => {
      const passwordHash = bcrypt.hashSync(user.password, SALT_ROUNDS);
      const result = insertUserStmt.run(user.name, user.email, passwordHash, user.role, user.status);
      createdUsers[user.role] = result.lastInsertRowid;
    });

    demoRecords.forEach((record, index) => {
      const creatorId = index % 2 === 0 ? createdUsers.admin : createdUsers.analyst;
      insertRecordStmt.run(creatorId, record.amount, record.type, record.category, record.date, record.notes);
    });
  });

  runSeed();

  console.log("Seeding complete.");
  console.log("Demo credentials:");
  demoUsers.forEach((user) => {
    console.log(`- ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
  });
}

try {
  seed();
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
