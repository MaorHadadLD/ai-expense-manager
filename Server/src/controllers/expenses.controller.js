// src/controllers/expenses.controller.js
const { prisma } = require("../db");

// יצירת הוצאה חדשה
exports.createExpense = async (req, res, next) => {
  try {
    const userId = req.user.userId; // מגיע מה-authMiddleware
    const { amount, description, category, date } = req.body;

    if (amount === undefined || amount === null || !category || !date) {
      return res
        .status(400)
        .json({ message: "amount, category and date are required" });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a positive number" });
    }

    const expenseDate = new Date(date);
    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: parsedAmount,
        description: description || null,
        category,
        date: expenseDate,
      },
    });

    return res.status(201).json(expense);
  } catch (err) {
    console.error("❌ createExpense error:", err);
    next(err);
  }
};

// החזרת הוצאות לפי חודש/שנה (או כל ההוצאות אם לא נשלח)
exports.getExpenses = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    let where = { userId };

    if (year && month) {
      const y = Number(year);
      const m = Number(month);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);

      where.date = {
        gte: start,
        lt: end,
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    res.json(expenses);
  } catch (err) {
    console.error("❌ getExpenses error:", err);
    next(err);
  }
};

// סיכום חודשי
exports.getMonthlySummary = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;

    if (!year || !month) {
      return res
        .status(400)
        .json({ message: "year and month are required (query params)" });
    }

    const y = Number(year);
    const m = Number(month);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      year: y,
      month: m,
      total,
      count: expenses.length,
    });
  } catch (err) {
    console.error("❌ getMonthlySummary error:", err);
    next(err);
  }
};

// מחיקת הוצאה לפי ID (רק של המשתמש המחובר)
exports.deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const existing = await prisma.expense.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Expense deleted" });
  } catch (err) {
    console.error("❌ deleteExpense error:", err);
    next(err);
  }
};
