const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const authMiddleware = require('./middlewares/authMiddleware');
const expensesRoutes = require('./routes/expenses.routes');
const {errorHandler} = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const incomeRoutes = require("./routes/income.routes");
const savingsRoutes = require("./routes/savings.routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/savings", savingsRoutes);

app.get("/api/helth", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("AI Expense Manager API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;