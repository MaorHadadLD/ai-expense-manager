// src/controllers/savings.controller.js
const { prisma } = require("../db");

/**
 * יצירת קופת חיסכון חדשה
 * POST /api/savings
 * body: { name, target, color?, icon? }
 */
async function createSavingGoal(req, res, next) {
  try {
    const userId = req.user?.userId;
    const { name, target, color, icon } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name || !target) {
      return res
        .status(400)
        .json({ message: "name and target are required" });
    }

    const goal = await prisma.savingGoal.create({
      data: {
        userId,
        name,
        target: parseFloat(target),
        color: color || null,
        icon: icon || null,
      },
    });

    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

/**
 * שליפת כל קופות החיסכון של המשתמש
 * GET /api/savings
 * מחזיר גם סיכום כמה נחסך לכל קופה ואחוז התקדמות
 */
async function getSavingGoals(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const goals = await prisma.savingGoal.findMany({
      where: { userId },
      include: {
        deposits: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = goals.map((g) => {
      const totalSaved = g.deposits.reduce(
        (sum, d) => sum + d.amount,
        0
      );

      const progressPercent =
        g.target > 0 ? Math.min(100, Math.round((totalSaved / g.target) * 100)) : 0;

      return {
        id: g.id,
        name: g.name,

        // 🔹 שינוי שמות כדי להתאים לפרונט
        targetAmount: g.target,
        currentAmount: totalSaved,

        color: g.color,
        icon: g.icon,
        createdAt: g.createdAt,

        // 🔹 שדה נחמד לפרוגרס
        progressPercent,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

/**
 * פרטי קופה אחת + סטטיסטיקות
 * GET /api/savings/:id
 */
async function getSavingGoalById(req, res, next) {
  try {
    const userId = req.user?.userId;
    const goalId = Number(req.params.id);   // 👈 שינוי קטן: Number במקום parseInt

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ הגנה: אם ה-id לא מספר תקין → 400
    if (!Number.isInteger(goalId) || goalId <= 0) {
      return res.status(400).json({ message: "Invalid saving goal id" });
    }

    const goal = await prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
      include: {
        deposits: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ message: "Saving goal not found" });
    }

    const totalSaved = goal.deposits.reduce((sum, d) => sum + d.amount, 0);

    let monthlyAverage = 0;
    let monthsToTarget = null;

    if (goal.deposits.length > 0) {
      const firstDate = goal.deposits[0].date;
      const now = new Date();

      const monthsDiff =
        (now.getFullYear() - firstDate.getFullYear()) * 12 +
        (now.getMonth() - firstDate.getMonth()) +
        1;

      monthlyAverage = totalSaved / monthsDiff;

      const remaining = goal.target - totalSaved;
      if (remaining > 0 && monthlyAverage > 0) {
        monthsToTarget = remaining / monthlyAverage;
      }
    }

    return res.json({
      id: goal.id,
      name: goal.name,
      target: goal.target,
      color: goal.color,
      icon: goal.icon,
      createdAt: goal.createdAt,
      totalSaved,
      deposits: goal.deposits,
      stats: {
        monthlyAverage,
        monthsToTarget,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * הוספת הפקדה לקופה
 * POST /api/savings/:id/deposits
 * body: { amount, incomeId?, date? }
 */
async function addSavingDeposit(req, res, next) {
  try {
    const userId = req.user?.userId;
    const goalId = parseInt(req.params.id, 10);
    const { amount, incomeId, date } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!amount) {
      return res
        .status(400)
        .json({ message: "amount is required" });
    }

    const goal = await prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return res.status(404).json({ message: "Saving goal not found" });
    }

    const deposit = await prisma.savingDeposit.create({
      data: {
        goalId: goal.id,
        incomeId: incomeId ? parseInt(incomeId, 10) : null,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json(deposit);
  } catch (err) {
    next(err);
  }
}

// מחיקת קופת חיסכון + כל ההפקדות שלה
async function deleteSavingGoal(req, res, next) {
  try {
    const userId = req.user?.userId;
    const goalId = parseInt(req.params.id, 10);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // מוודאים שהקופה שייכת למשתמש
    const goal = await prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return res.status(404).json({ message: "Saving goal not found" });
    }

    // מוחקים קודם את ההפקדות שלה
    await prisma.savingDeposit.deleteMany({
      where: { goalId: goal.id },
    });

    // עכשיו מוחקים את הקופה
    await prisma.savingGoal.delete({
      where: { id: goal.id },
    });

    return res.status(204).send(); // אין גוף
  } catch (err) {
    next(err);
  }
}

// עריכת קופת חיסכון (כרגע: שם בלבד)
async function updateSavingGoal(req, res, next) {
  try {
    const userId = req.user?.userId;
    const goalId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    // מוודאים שהקופה שייכת למשתמש
    const goal = await prisma.savingGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return res.status(404).json({ message: "Saving goal not found" });
    }

    const updated = await prisma.savingGoal.update({
      where: { id: goal.id },
      data: { name },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

// מחיקת הפקדה בודדת
async function deleteSavingDeposit(req, res, next) {
  try {
    const userId = req.user?.userId;
    const depositId = parseInt(req.params.depositId, 10);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deposit = await prisma.savingDeposit.findUnique({
      where: { id: depositId },
      include: {
        goal: true, // כדי לוודא שההפקדה שייכת למשתמש
      },
    });

    if (!deposit || deposit.goal.userId !== userId) {
      return res.status(404).json({ message: "Deposit not found" });
    }

    await prisma.savingDeposit.delete({
      where: { id: deposit.id },
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}




module.exports = {
  createSavingGoal,
  getSavingGoals,
  getSavingGoalById,
  addSavingDeposit,
  deleteSavingGoal,
  updateSavingGoal,
  deleteSavingDeposit,
};
