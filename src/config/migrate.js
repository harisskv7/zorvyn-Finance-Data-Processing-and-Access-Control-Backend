require("dotenv").config();

const { initializeDatabase, resolveDbPath } = require("./db");

try {
  initializeDatabase();
  console.log(`Migration complete. Database ready at: ${resolveDbPath()}`);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
