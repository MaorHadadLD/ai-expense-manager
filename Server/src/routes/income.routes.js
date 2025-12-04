// src/routes/income.routes.js
const express = require("express");
const router = express.Router();

const { createIncome, getIncomes } = require("../controllers/income.controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.post("/", createIncome);   // POST /api/incomes
router.get("/", getIncomes);      // GET  /api/incomes

module.exports = router;
