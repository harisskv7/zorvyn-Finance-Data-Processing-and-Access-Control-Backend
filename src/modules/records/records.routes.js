const express = require("express");

const controller = require("./records.controller");
const { authenticateToken } = require("../../middleware/auth.middleware");
const { authorizeRoles } = require("../../middleware/role.middleware");
const { validate } = require("../../middleware/validate.middleware");
const {
  recordIdParamSchema,
  createRecordSchema,
  updateRecordSchema,
  recordsQuerySchema,
} = require("./records.validation");

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   - name: Records
 *     description: Financial records APIs
 */

/**
 * @swagger
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               user_id: { type: integer, example: 1 }
 *               amount: { type: number, example: 5000 }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string, example: salary }
 *               date: { type: string, example: 2024-11-23 }
 *               notes: { type: string, example: Monthly income }
 *     responses:
 *       201:
 *         description: Record created
 */
router.post("/", authorizeRoles("admin"), validate(createRecordSchema), controller.createRecord);

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: Get financial records (Analyst/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [income, expense] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: 2024-01-01 }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: 2024-12-31 }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Records list
 */
router.get("/", authorizeRoles("analyst", "admin"), validate(recordsQuerySchema, "query"), controller.getRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get financial record by id (Analyst/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record details
 */
router.get("/:id", authorizeRoles("analyst", "admin"), validate(recordIdParamSchema, "params"), controller.getRecordById);

/**
 * @swagger
 * /api/records/{id}:
 *   patch:
 *     tags: [Records]
 *     summary: Update financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date: { type: string, example: 2024-11-23 }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Record updated
 */
router.patch(
  "/:id",
  authorizeRoles("admin"),
  validate(recordIdParamSchema, "params"),
  validate(updateRecordSchema),
  controller.patchRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     tags: [Records]
 *     summary: Soft delete financial record (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Record soft deleted
 */
router.delete("/:id", authorizeRoles("admin"), validate(recordIdParamSchema, "params"), controller.deleteRecord);

module.exports = router;
