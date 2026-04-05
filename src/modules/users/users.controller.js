const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/http-error");
const usersService = require("./users.service");

const getUsers = asyncHandler(async (req, res) => {
  const result = usersService.listUsers(req.query);
  return sendSuccess(res, result, "Users fetched successfully");
});

const getUserById = asyncHandler(async (req, res) => {
  const targetId = req.params.id;

  if (req.user.role !== "admin" && req.user.id !== targetId) {
    throw new AppError("You can only view your own profile", 403, "FORBIDDEN");
  }

  const user = usersService.getUserById(targetId);
  return sendSuccess(res, { user }, "User fetched successfully");
});

const patchUserRole = asyncHandler(async (req, res) => {
  const updated = usersService.updateUserRole(req.params.id, req.body.role);
  return sendSuccess(res, { user: updated }, "User role updated successfully");
});

const patchUserStatus = asyncHandler(async (req, res) => {
  const updated = usersService.updateUserStatus(req.params.id, req.body.status, req.user.id);
  return sendSuccess(res, { user: updated }, "User status updated successfully");
});

module.exports = {
  getUsers,
  getUserById,
  patchUserRole,
  patchUserStatus,
};
