const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const recordsService = require("./records.service");

const createRecord = asyncHandler(async (req, res) => {
  const record = recordsService.createRecord(req.body, req.user.id);
  return sendSuccess(res, { record }, "Record created successfully", 201);
});

const getRecords = asyncHandler(async (req, res) => {
  const result = recordsService.listRecords(req.query, req.user.role);
  return sendSuccess(res, result, "Records fetched successfully", 200);
});

const getRecordById = asyncHandler(async (req, res) => {
  const record = recordsService.getRecordById(req.params.id);
  return sendSuccess(res, { record }, "Record fetched successfully", 200);
});

const patchRecord = asyncHandler(async (req, res) => {
  const record = recordsService.updateRecord(req.params.id, req.body);
  return sendSuccess(res, { record }, "Record updated successfully", 200);
});

const deleteRecord = asyncHandler(async (req, res) => {
  recordsService.softDeleteRecord(req.params.id);
  return sendSuccess(res, { recordId: req.params.id }, "Record deleted successfully", 200);
});

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  patchRecord,
  deleteRecord,
};
