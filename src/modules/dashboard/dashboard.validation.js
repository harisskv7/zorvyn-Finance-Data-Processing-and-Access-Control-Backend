const { z } = require("zod");

const trendsQuerySchema = z.object({
  period: z.enum(["monthly", "weekly"]).default("monthly"),
});

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

module.exports = {
  trendsQuerySchema,
  recentQuerySchema,
};
