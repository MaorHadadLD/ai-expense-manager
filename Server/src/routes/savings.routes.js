// src/routes/savings.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  createSavingGoal,
  getSavingGoals,
  getSavingGoalById,
  addSavingDeposit,
  updateSavingGoal,      // ✅
  deleteSavingGoal,      // ✅
  deleteSavingDeposit,   // ✅
} = require("../controllers/savings.controller");

router.use(authMiddleware);

// יצירת קופה
router.post("/", createSavingGoal);

// כל הקופות
router.get("/", getSavingGoals);

// פרטי קופה
router.get("/:id", getSavingGoalById);

// הפקדה לקופה
router.post("/:id/deposits", addSavingDeposit);

// עדכון קופה (שם כרגע)
router.patch("/:id", updateSavingGoal);

// מחיקת קופה
router.delete("/:id", deleteSavingGoal);

// מחיקת הפקדה
router.delete("/deposits/:depositId", deleteSavingDeposit);

module.exports = router;
