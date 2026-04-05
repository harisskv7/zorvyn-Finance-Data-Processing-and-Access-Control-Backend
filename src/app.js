require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const { initializeDatabase } = require("./config/db");
const { ensureDemoData } = require("./config/bootstrap");
const swaggerSpec = require("./config/swagger");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const recordsRoutes = require("./modules/records/records.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

initializeDatabase();
ensureDemoData();

const app = express();
const publicDir = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(publicDir));

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy",
    data: { uptime: process.uptime() },
  });
});

app.get("/api/docs-json", (req, res) => {
  return res.status(200).json(swaggerSpec);
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      url: "/api/docs-json",
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  return res.sendFile(path.join(publicDir, "index.html"));
});

app.get(/^\/(?!api).*/, (req, res) => {
  return res.sendFile(path.join(publicDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
