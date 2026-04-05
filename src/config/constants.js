const ROLES = Object.freeze({
  VIEWER: "viewer",
  ANALYST: "analyst",
  ADMIN: "admin",
});

const USER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
});

const RECORD_TYPES = Object.freeze({
  INCOME: "income",
  EXPENSE: "expense",
});

const DEFAULT_PAGINATION = Object.freeze({
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
});

module.exports = {
  ROLES,
  USER_STATUS,
  RECORD_TYPES,
  DEFAULT_PAGINATION,
};
