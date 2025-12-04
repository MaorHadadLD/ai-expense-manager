// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");

// רישום משתמש חדש
router.post("/register", register);

// התחברות משתמש
router.post("/login", login);

module.exports = router;
