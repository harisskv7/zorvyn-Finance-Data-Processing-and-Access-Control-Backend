require("dotenv").config();

const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Finance backend server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});
