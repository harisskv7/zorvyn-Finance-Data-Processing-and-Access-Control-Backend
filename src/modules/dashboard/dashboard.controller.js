const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const dashboardService = require("./dashboard.service");

const getSummary = asyncHandler(async (req, res) => {
  const summary = dashboardService.getSummary();
  return sendSuccess(res, { summary }, "Dashboard summary fetched successfully");
});

const getByCategory = asyncHandler(async (req, res) => {
  const categories = dashboardService.getByCategory();
  return sendSuccess(res, { categories }, "Category analytics fetched successfully");
});

const getTrends = asyncHandler(async (req, res) => {
  const trends = dashboardService.getTrends(req.query.period);
  return sendSuccess(res, { period: req.query.period, trends }, "Trend analytics fetched successfully");
});

const getRecent = asyncHandler(async (req, res) => {
  const transactions = dashboardService.getRecent(req.query.limit);
  return sendSuccess(res, { transactions }, "Recent transactions fetched successfully");
});

module.exports = {
  getSummary,
  getByCategory,
  getTrends,
  getRecent,
};
