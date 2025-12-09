// src/routes/savings.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  createSavingGoal,
  getSavingGoals,
  getSavingGoalById,
  addSavingDeposit,
} = require("../controllers/savings.controller");

router.use(authMiddleware);

router.post("/", createSavingGoal);

router.get("/", getSavingGoals);

router.get("/:id", getSavingGoalById);

router.post("/:id/deposits", addSavingDeposit);

// router.post("/goals/:id/deposits", createSavingDeposit);


module.exports = router;
