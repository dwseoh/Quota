const express = require("express");

const userRoutes = require("./routes/userRoutes");
const searchRoutes = require("./routes/searchRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("BadCostApp is running"));

app.use(userRoutes);
app.use(searchRoutes);
app.use(dashboardRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`BadCostApp running on http://localhost:${PORT}`);
});
