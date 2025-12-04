// src/controllers/income.controller.js
const { prisma } = require("../db");

exports.createIncome = async (req, res, next) => {
  try {
    const userId = req.user.id;
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

    res.status(201).json(income);
  } catch (err) {
    next(err);
  }
};

exports.getIncomes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const incomes = await prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    res.json(incomes);
  } catch (err) {
    next(err);
  }
};
