const { DEFAULT_PAGINATION } = require("../config/constants");

function buildPagination(page = DEFAULT_PAGINATION.PAGE, limit = DEFAULT_PAGINATION.LIMIT) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGINATION.PAGE;
  const rawLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_PAGINATION.LIMIT;
  const safeLimit = Math.min(rawLimit, DEFAULT_PAGINATION.MAX_LIMIT);
  const offset = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    offset,
  };
}

function buildMeta(total, page, limit) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = {
  buildPagination,
  buildMeta,
};
