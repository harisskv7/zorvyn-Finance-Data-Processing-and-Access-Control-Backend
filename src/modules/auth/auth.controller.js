const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const user = authService.registerUser(req.body);
  return sendSuccess(res, { user }, "User registered successfully", 201);
});

const login = asyncHandler(async (req, res) => {
  const result = authService.loginUser(req.body);
  return sendSuccess(res, result, "Login successful", 200);
});

module.exports = {
  register,
  login,
};
