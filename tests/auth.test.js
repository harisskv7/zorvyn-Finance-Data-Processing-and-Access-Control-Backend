const fs = require("fs");
const path = require("path");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.DB_PATH = "data/test.db";
process.env.JWT_SECRET = "test_secret_key";
process.env.JWT_EXPIRES_IN = "1h";

const testDbPath = path.resolve(process.cwd(), process.env.DB_PATH);
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const app = require("../src/app");
const { closeDb, getDb } = require("../src/config/db");

afterAll(() => {
  closeDb();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe("Auth module", () => {
  it("registers a new user and logs in successfully", async () => {
    const registerPayload = {
      name: "Test Candidate",
      email: "candidate@example.com",
      password: "Password123",
    };

    const registerResponse = await request(app).post("/api/auth/register").send(registerPayload);

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.user.email).toBe(registerPayload.email);
    expect(registerResponse.body.data.user.role).toBe("viewer");

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: registerPayload.email, password: registerPayload.password });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.token).toBeDefined();
  });

  it("rejects login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "candidate@example.com", password: "WrongPass" });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("RBAC and Records module", () => {
  let viewerToken;
  let adminToken;

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Viewer User",
      email: "viewer@finance.com",
      password: "viewer123",
    });

    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@finance.com",
      password: "admin123",
    });

    const db = getDb();
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run("admin@finance.com");

    const viewerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "viewer@finance.com", password: "viewer123" });

    const adminLogin = await request(app).post("/api/auth/login").send({ email: "admin@finance.com", password: "admin123" });

    viewerToken = viewerLogin.body.data.token;
    adminToken = adminLogin.body.data.token;
  });

  it("Viewer cannot create a record (expects 403)", async () => {
    const response = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        amount: 500,
        type: "income",
        category: "salary",
        date: "2024-06-01",
        notes: "June salary",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("Admin can create a record (expects 201)", async () => {
    const response = await request(app)
      .post("/api/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 500,
        type: "income",
        category: "salary",
        date: "2024-06-01",
        notes: "June salary",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.amount ?? response.body.data.record?.amount).toBe(500);
  });

  it("Viewer is blocked from analytics endpoint (expects 403)", async () => {
    const response = await request(app)
      .get("/api/dashboard/by-category")
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
