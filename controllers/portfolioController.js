const Portfolio = require("../models/Portfolio");

function getUserId(req) {
  return req.user?.id || req.user?.userId;
}

function createSlug(name) {
  const base = String(name || "portfolio")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const random = Math.random().toString(36).substring(2, 8);

  return `${base || "portfolio"}-${random}`;
}

function cleanPortfolio(portfolio, req = null) {
  const obj = portfolio.toObject ? portfolio.toObject() : { ...portfolio };

  delete obj.__v;

  return obj;
}

// CREATE
const createPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = { ...req.body };

    body.user = userId;

    if (!body.name) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (
      !body.template ||
      !/^template-(?:[1-9]|[1-4][0-9]|50)$/.test(body.template)
    ) {
      body.template = "template-1";
    }

    delete body._id;
    delete body.id;
    delete body.owner;

    const portfolio = await Portfolio.create(body);

    return res.status(201).json({
      success: true,
      message: "Portfolio created successfully.",
      portfolio: cleanPortfolio(portfolio, req),
    });
  } catch (error) {
    console.error("Create portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create portfolio.",
    });
  }
};

// GET ALL
const getMyPortfolios = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const portfolios = await Portfolio.find({
      user: userId,
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      portfolios: portfolios.map((p) => cleanPortfolio(p, req)),
    });
  } catch (error) {
    console.error("Get portfolios error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get portfolios.",
    });
  }
};

// GET ONE
const getPortfolioById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    return res.json({
      success: true,
      portfolio: cleanPortfolio(portfolio, req),
    });
  } catch (error) {
    console.error("Get portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid portfolio ID.",
    });
  }
};

// UPDATE
const updatePortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = { ...req.body };

    delete body._id;
    delete body.id;
    delete body.user;
    delete body.owner;
    delete body.slug;
    delete body.publicUrl;

    if (
      body.template &&
      !/^template-(?:[1-9]|[1-4][0-9]|50)$/.test(body.template)
    ) {
      delete body.template;
    }

    const portfolio = await Portfolio.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId,
      },
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    return res.json({
      success: true,
      message: "Portfolio saved successfully.",
      portfolio: cleanPortfolio(portfolio, req),
    });
  } catch (error) {
    console.error("Update portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to save portfolio.",
    });
  }
};

// DELETE
const deletePortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);

    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    return res.json({
      success: true,
      message: "Portfolio deleted successfully.",
    });
  } catch (error) {
    console.error("Delete portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete portfolio.",
    });
  }
};

// PUBLISH
const publishPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    if (!portfolio.slug) {
      portfolio.slug = createSlug(portfolio.name);
    }

    portfolio.published = true;

    const host = `${req.protocol}://${req.get("host")}`;

    portfolio.publicUrl = `${host}/p/${portfolio.slug}`;

    await portfolio.save();

    return res.json({
      success: true,
      message: "Portfolio published successfully.",
      portfolio: cleanPortfolio(portfolio, req),
      url: portfolio.publicUrl,
      publicUrl: portfolio.publicUrl,
    });
  } catch (error) {
    console.error("Publish portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to publish portfolio.",
    });
  }
};

// UNPUBLISH
const unpublishPortfolio = async (req, res) => {
  try {
    const userId = getUserId(req);

    const portfolio = await Portfolio.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId,
      },
      {
        published: false,
      },
      {
        new: true,
      }
    );

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    return res.json({
      success: true,
      message: "Portfolio unpublished successfully.",
      portfolio: cleanPortfolio(portfolio, req),
    });
  } catch (error) {
    console.error("Unpublish portfolio error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to unpublish portfolio.",
    });
  }
};

// PUBLIC
const getPublicPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      slug: req.params.slug,
      published: true,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Published portfolio not found.",
      });
    }

    return res.json({
      success: true,
      portfolio: cleanPortfolio(portfolio),
    });
  } catch (error) {
    console.error("Public portfolio error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load published portfolio.",
    });
  }
};

module.exports = {
  createPortfolio,
  getMyPortfolios,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
};