const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ==============================
// PUBLIC AUTH ROUTES
// ==============================
router.post("/register", register);
router.post("/login", login);

// ==============================
// PROTECTED AUTH ROUTES
// ==============================
router.get("/me", authMiddleware, getMe);

module.exports = router;