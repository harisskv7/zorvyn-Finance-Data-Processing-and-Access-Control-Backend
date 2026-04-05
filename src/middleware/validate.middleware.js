const AppError = require("../utils/http-error");

function validate(schema, source = "body") {
  return async (req, res, next) => {
    const parseResult = await schema.safeParseAsync(req[source]);

    if (!parseResult.success) {
      return next(
        new AppError(
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          parseResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          }))
        )
      );
    }

    req[source] = parseResult.data;
    return next();
  };
}

module.exports = {
  validate,
};
