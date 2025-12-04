// src/routes/expenses.routes.js
const Router = require("router");
const {
  createExpense,
  getExpenses,
  getMonthlySummary,
  deleteExpense,
} = require("../controllers/expenses.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = Router();

// כל הראוטים דורשים התחברות
router.use(authMiddleware);

// POST /api/expenses
router.post("/", createExpense);

// GET /api/expenses
router.get("/", getExpenses);

// GET /api/expenses/summary/monthly
router.get("/summary/monthly", getMonthlySummary);

// DELETE /api/expenses/:id
router.delete("/:id", deleteExpense);

module.exports = router;
