// src/controllers/income.controller.js
const { prisma } = require("../db");

async function createIncome(req, res, next) {
  try {
    console.log("🔹 createIncome req.user:", req.user);
    console.log("🔹 createIncome body:", req.body);

    // אם אין userId – לא מתקרבים בכלל ל-Prisma
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId; // 👈 זה הקריטי

    const { amount, source, date } = req.body;

    if (!amount || !date) {
      return res
        .status(400)
        .json({ message: "amount and date are required" });
    }

    const income = await prisma.income.create({
      data: {
        userId,
        amount: parseFloat(amount),
        source: source || "salary",
        date: new Date(date),
      },
    });

    return res.status(201).json(income);
  } catch (err) {
    console.error("❌ Error in createIncome:", err);
    return next(err);
  }
}

async function getIncomes(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.userId;

    const incomes = await prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return res.json(incomes);
  } catch (err) {
    console.error("❌ Error in getIncomes:", err);
    return next(err);
  }
}

module.exports = {
  createIncome,
  getIncomes,
};
