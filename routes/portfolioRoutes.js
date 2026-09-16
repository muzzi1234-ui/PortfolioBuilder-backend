const express = require("express");

const {
  createPortfolio,
  getMyPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
} = require("../controllers/portfolioController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public portfolio
router.get("/public/:slug", getPublicPortfolio);

// Everything below requires login
router.use(authMiddleware);

router.post("/", createPortfolio);

router.get("/", getMyPortfolios);

router.get("/:id", getPortfolioById);

router.put("/:id", updatePortfolio);

router.delete("/:id", deletePortfolio);

router.patch("/:id/publish", publishPortfolio);

router.patch("/:id/unpublish", unpublishPortfolio);

module.exports = router;