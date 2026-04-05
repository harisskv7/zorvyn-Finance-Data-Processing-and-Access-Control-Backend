const { z } = require("zod");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((date) => !Number.isNaN(Date.parse(date)), "Invalid date value");

const recordIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Record id must be a positive integer"),
});

const createRecordSchema = z.object({
  user_id: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1, "Category is required").max(80, "Category is too long"),
  date: isoDate,
  notes: z.string().trim().max(500, "Notes are too long").optional(),
});

const updateRecordSchema =
  z
    .object({
      amount: z.coerce.number().positive("Amount must be greater than zero").optional(),
      type: z.enum(["income", "expense"]).optional(),
      category: z.string().trim().min(1, "Category is required").max(80, "Category is too long").optional(),
      date: isoDate.optional(),
      notes: z.string().trim().max(500, "Notes are too long").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    });

const recordsQuerySchema = z
  .object({
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().trim().min(1).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message: "from date cannot be after to date",
      path: ["from"],
    }
  );

module.exports = {
  recordIdParamSchema,
  createRecordSchema,
  updateRecordSchema,
  recordsQuerySchema,
};
