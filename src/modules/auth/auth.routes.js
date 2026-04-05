const express = require("express");

const { validate } = require("../../middleware/validate.middleware");
const controller = require("./auth.controller");
const { registerSchema, loginSchema } = require("./auth.validation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user where default role is viewer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Alice Johnson" }
 *               email: { type: string, example: "alice@zorvyn.com" }
 *               password: { type: string, example: "StrongPass123" }
 *     responses:
 *       201:
 *         description: Registered successfully
 *       409:
 *         description: Email already exists
 */
router.post("/register", validate(registerSchema), controller.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "admin@zorvyn.com" }
 *               password: { type: string, example: "Admin@123" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginSchema), controller.login);

module.exports = router;
