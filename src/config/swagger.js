const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Zorvyn Finance Backend API",
      version: "1.0.0",
      description: "Finance data processing and RBAC backend",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        StandardSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Request successful" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Validation failed" },
            code: { type: "integer", example: 400 },
            errorCode: { type: "string", example: "VALIDATION_ERROR" },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../modules/**/*.routes.js")],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
