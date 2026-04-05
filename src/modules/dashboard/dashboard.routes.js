const express = require("express");

const controller = require("./dashboard.controller");
const { authenticateToken } = require("../../middleware/auth.middleware");
const { authorizeRoles } = require("../../middleware/role.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { trendsQuerySchema, recentQuerySchema } = require("./dashboard.validation");

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard summary and analytics APIs
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary totals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary fetched
 */
router.get("/summary", controller.getSummary);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get totals grouped by category (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category analytics fetched
 */
router.get("/by-category", authorizeRoles("analyst", "admin"), controller.getByCategory);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get trend analytics by month or week (Analyst/Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [monthly, weekly], default: monthly }
 *     responses:
 *       200:
 *         description: Trend analytics fetched
 */
router.get(
  "/trends",
  authorizeRoles("analyst", "admin"),
  validate(trendsQuerySchema, "query"),
  controller.getTrends
);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent financial transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 10, default: 5 }
 *     responses:
 *       200:
 *         description: Recent transactions fetched
 */
router.get("/recent", validate(recentQuerySchema, "query"), controller.getRecent);

module.exports = router;
