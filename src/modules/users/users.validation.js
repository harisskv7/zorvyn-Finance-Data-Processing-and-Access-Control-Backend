const { z } = require("zod");

const roleEnum = z.enum(["viewer", "analyst", "admin"]);
const statusEnum = z.enum(["active", "inactive"]);

const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive("User id must be a positive integer"),
});

const usersListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  search: z.string().trim().min(1).optional(),
});

const updateRoleSchema = z.object({
  role: roleEnum,
});

const updateStatusSchema = z.object({
  status: statusEnum,
});

module.exports = {
  userIdParamSchema,
  usersListQuerySchema,
  updateRoleSchema,
  updateStatusSchema,
};
