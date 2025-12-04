// src/controllers/auth.controller.js
const { prisma } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// פונקציה ליצירת JWT
function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ----------------------
// 📌 Register
// ----------------------
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // ולידציה בסיסית
    if (!name || !email || !password) {
      const err = new Error("Name, email and password are required");
      err.status = 400;
      throw err;
    }

    // לבדוק אם משתמש כבר קיים
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      const err = new Error("User with this email already exists");
      err.status = 409;
      throw err;
    }

    // להצפין סיסמה
    const passwordHash = await bcrypt.hash(password, 10);

    // ליצור משתמש חדש
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // ליצור טוקן
    const token = createToken(user);

    // להחזיר תשובה
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

// ----------------------
// 📌 Login
// ----------------------
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password are required");
      err.status = 400;
      throw err;
    }

    // למצוא משתמש לפי אימייל
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // לבדוק סיסמה
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    // יצירת טוקן
    const token = createToken(user);

    // להחזיר תשובה
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
