const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "portfolio-builder-secret";

const uploadDir = process.env.VERCEL ? "/tmp/portfolio-builder-uploads" : path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

app.use("/uploads", express.static(uploadDir));

/* =========================================================
   UPLOAD
========================================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || ".jpg");

    const name =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10) +
      ext;

    cb(null, name);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }

    cb(null, true);
  },
});

/* =========================================================
   TEMPLATES
========================================================= */

const templateIds = Array.from(
  { length: 50 },
  (_, index) => `template-${index + 1}`
);

/* =========================================================
   USER MODEL
========================================================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

/* =========================================================
   PORTFOLIO MODEL
========================================================= */

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    technologies: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const customSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const portfolioSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    photoUrl: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    portfolioUrl: {
      type: String,
      default: "",
    },

    skills: {
      type: String,
      default: "",
    },

    education: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "",
    },

    services: {
      type: String,
      default: "",
    },

    achievements: {
      type: String,
      default: "",
    },

    certifications: {
      type: String,
      default: "",
    },

    languages: {
      type: String,
      default: "",
    },

    interests: {
      type: String,
      default: "",
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    customSections: {
      type: [customSectionSchema],
      default: [],
    },

    template: {
      type: String,
      enum: templateIds,
      default: "template-1",
    },

    published: {
      type: Boolean,
      default: false,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

/* =========================================================
   JWT
========================================================= */

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
}

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

function auth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

/* =========================================================
   HELPERS
========================================================= */

function cleanPortfolio(portfolio) {
  const object = portfolio.toObject
    ? portfolio.toObject()
    : { ...portfolio };

  object.id = object._id;

  delete object.owner;
  delete object.__v;

  return object;
}

function makeSlug(name, id) {
  const base =
    String(name || "portfolio")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "portfolio";

  return `${base}-${String(id).slice(-6)}`;
}

function normalizeUrl(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (!text) return "";

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return `https://${text}`;
}
 /* =========================================================
   DATABASE
========================================================= */

let mongoConnection = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing.");
  }

  if (!mongoConnection) {
    mongoConnection = mongoose.connect(process.env.MONGO_URI);
  }

  await mongoConnection;

  return mongoose.connection;
}

/* =========================================================
   DATABASE MIDDLEWARE
========================================================= */

app.use(async function (req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});
/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", function (req, res) {
  res.json({
    success: true,
    message: "Portfolio Builder backend is healthy.",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/auth/register", async function (req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    const name = String(req.body.name || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", async function (req, res) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sign in.",
    });
  }
});

/* =========================================================
   CURRENT USER
========================================================= */

app.get("/api/auth/me", auth, async function (req, res) {
  try {
    const user = await User.findById(req.user.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load account.",
    });
  }
});

/* =========================================================
   GET USER PORTFOLIOS
========================================================= */

app.get("/api/portfolios", auth, async function (req, res) {
  try {
    const portfolios = await Portfolio.find({
      owner: req.user.id,
    }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      portfolios: portfolios.map(cleanPortfolio),
    });
  } catch (error) {
    console.error("GET PORTFOLIOS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load portfolios.",
    });
  }
});

/* =========================================================
   CREATE PORTFOLIO
========================================================= */

app.post("/api/portfolios", auth, async function (req, res) {
  try {
    const body = {
      name: req.body.name || "",
      title: req.body.title || "",
      headline: req.body.headline || "",
      bio: req.body.bio || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      location: req.body.location || "",
      website: req.body.website || "",
      photoUrl: req.body.photoUrl || "",
      linkedin: req.body.linkedin || "",
      github: req.body.github || "",
      portfolioUrl: req.body.portfolioUrl || "",
      skills: req.body.skills || "",
      education: req.body.education || "",
      experience: req.body.experience || "",
      services: req.body.services || "",
      achievements: req.body.achievements || "",
      certifications: req.body.certifications || "",
      languages: req.body.languages || "",
      interests: req.body.interests || "",
      projects: Array.isArray(req.body.projects)
        ? req.body.projects
        : [],
      customSections: Array.isArray(req.body.customSections)
        ? req.body.customSections
        : [],
      template: templateIds.includes(req.body.template)
        ? req.body.template
        : "template-1",

      /*
        IMPORTANT:
        Only owner is written here.
        No user field.
        No $setOnInsert.
        No conflicting MongoDB update.
      */
      owner: req.user.id,
    };

    const portfolio = await Portfolio.create(body);

    res.status(201).json({
      success: true,
      portfolio: cleanPortfolio(portfolio),
    });
  } catch (error) {
    console.error("CREATE PORTFOLIO ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Unable to create portfolio.",
    });
  }
});

/* =========================================================
   GET SINGLE PORTFOLIO
========================================================= */

app.get(
  "/api/portfolios/:id",
  auth,
  async function (req, res) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found.",
        });
      }

      res.json({
        success: true,
        portfolio: cleanPortfolio(portfolio),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Invalid portfolio ID.",
      });
    }
  }
);

/* =========================================================
   UPDATE PORTFOLIO
========================================================= */

app.put(
  "/api/portfolios/:id",
  auth,
  async function (req, res) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found.",
        });
      }

      /*
        IMPORTANT:
        We modify the Mongoose document directly.

        This completely avoids the previous:
        "Updating the path 'user' would create a conflict at 'user'"
        problem.
      */

      const fields = [
        "name",
        "title",
        "headline",
        "bio",
        "email",
        "phone",
        "location",
        "website",
        "photoUrl",
        "linkedin",
        "github",
        "portfolioUrl",
        "skills",
        "education",
        "experience",
        "services",
        "achievements",
        "certifications",
        "languages",
        "interests",
      ];

      fields.forEach(function (field) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          portfolio[field] = req.body[field] ?? "";
        }
      });

      if (Array.isArray(req.body.projects)) {
        portfolio.projects = req.body.projects;
      }

      if (Array.isArray(req.body.customSections)) {
        portfolio.customSections = req.body.customSections;
      }

      if (req.body.template && templateIds.includes(req.body.template)) {
        portfolio.template = req.body.template;
      }

      await portfolio.save();

      res.json({
        success: true,
        portfolio: cleanPortfolio(portfolio),
      });
    } catch (error) {
      console.error("UPDATE PORTFOLIO ERROR:", error);

      res.status(400).json({
        success: false,
        message:
          error.message || "Unable to update portfolio.",
      });
    }
  }
);

/* =========================================================
   DELETE PORTFOLIO
========================================================= */

app.delete(
  "/api/portfolios/:id",
  auth,
  async function (req, res) {
    try {
      const portfolio = await Portfolio.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found.",
        });
      }

      res.json({
        success: true,
        message: "Portfolio deleted.",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Unable to delete portfolio.",
      });
    }
  }
);

/* =========================================================
   PUBLISH
========================================================= */

app.patch(
  "/api/portfolios/:id/publish",
  auth,
  async function (req, res) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found.",
        });
      }

      if (!portfolio.slug) {
        portfolio.slug = makeSlug(
          portfolio.name,
          portfolio._id
        );
      }

      portfolio.published = true;

      await portfolio.save();

      const host = `${req.protocol}://${req.get("host")}`;

      const publicUrl =
        `${host}/p/${portfolio.slug}`;

      res.json({
        success: true,
        url: publicUrl,
        publicUrl,
        portfolio: cleanPortfolio(portfolio),
      });
    } catch (error) {
      console.error("PUBLISH ERROR:", error);

      res.status(400).json({
        success: false,
        message:
          error.message || "Unable to publish portfolio.",
      });
    }
  }
);

/* =========================================================
   UNPUBLISH
========================================================= */

app.patch(
  "/api/portfolios/:id/unpublish",
  auth,
  async function (req, res) {
    try {
      const portfolio = await Portfolio.findOne({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: "Portfolio not found.",
        });
      }

      portfolio.published = false;

      await portfolio.save();

      res.json({
        success: true,
        portfolio: cleanPortfolio(portfolio),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Unable to unpublish portfolio.",
      });
    }
  }
);

/* =========================================================
   PROFILE PHOTO
========================================================= */

app.post(
  "/api/upload/profile",
  auth,
  upload.single("photo"),
  async function (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image is required.",
        });
      }

      const host =
        `${req.protocol}://${req.get("host")}`;

      const url =
        `${host}/uploads/${req.file.filename}`;

      res.json({
        success: true,
        url,
        photoUrl: url,
      });
    } catch (error) {
      console.error("PHOTO UPLOAD ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Photo upload failed.",
      });
    }
  }
);

/* =========================================================
   PUBLIC PORTFOLIO
========================================================= */

app.get(
  "/api/portfolios/public/:slug",
  async function (req, res) {
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

      res.json({
        success: true,
        portfolio: cleanPortfolio(portfolio),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to load public portfolio.",
      });
    }
  }
);

/* =========================================================
   PUBLIC SIMPLE PAGE
========================================================= */

app.get("/p/:slug", async function (req, res) {
  try {
    const portfolio = await Portfolio.findOne({
      slug: req.params.slug,
      published: true,
    });

    if (!portfolio) {
      return res.status(404).send("Portfolio not found.");
    }

    const p = cleanPortfolio(portfolio);

    const projects = (p.projects || [])
      .map(
        (project) => `
          <article style="
            padding:20px;
            margin:12px 0;
            border:1px solid #253241;
            border-radius:18px;
            background:#111820;
          ">
            <h3>${escapeHtml(project.title || "Project")}</h3>
            ${
              project.role
                ? `<p><strong>${escapeHtml(
                    project.role
                  )}</strong></p>`
                : ""
            }
            <p>${escapeHtml(
              project.description || ""
            )}</p>
            ${
              project.url
                ? `<a href="${escapeAttribute(
                    normalizeUrl(project.url)
                  )}" target="_blank" rel="noreferrer">View project</a>`
                : ""
            }
          </article>
        `
      )
      .join("");

    res.send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport"
          content="width=device-width,initial-scale=1"/>
        <title>${escapeHtml(
          p.name || "Portfolio"
        )}</title>

        <style>
          *{box-sizing:border-box}

          body{
            margin:0;
            background:#0B0F14;
            color:#F5F7FA;
            font-family:Arial,sans-serif;
          }

          main{
            width:min(900px,92%);
            margin:0 auto;
            padding:60px 0;
          }

          .hero{
            padding:35px;
            border:1px solid #253241;
            border-radius:28px;
            background:#111820;
          }

          img{
            width:120px;
            height:120px;
            object-fit:cover;
            border-radius:30px;
            border:2px solid #7DD3A7;
          }

          h1{
            font-size:42px;
            margin:20px 0 8px;
          }

          h2{
            color:#7DD3A7;
          }

          p{
            color:#AAB6C2;
            line-height:1.7;
          }

          a{
            color:#7DD3A7;
          }

          section{
            margin-top:25px;
          }

          footer{
            margin-top:45px;
            color:#64717E;
            text-align:center;
            font-size:13px;
          }
        </style>
      </head>

      <body>
        <main>

          <div class="hero">

            ${
              p.photoUrl
                ? `<img src="${escapeAttribute(
                    p.photoUrl
                  )}" alt="Profile"/>`
                : ""
            }

            <h1>${escapeHtml(
              p.name || "Your Name"
            )}</h1>

            <h2>${escapeHtml(
              p.title || "Professional"
            )}</h2>

            <p>${escapeHtml(
              p.headline || ""
            )}</p>

            <p>${escapeHtml(
              p.bio || ""
            )}</p>

          </div>

          ${
            p.experience
              ? `
                <section>
                  <h2>Experience</h2>
                  <p>${escapeHtml(
                    p.experience
                  )}</p>
                </section>
              `
              : ""
          }

          ${
            p.skills
              ? `
                <section>
                  <h2>Skills</h2>
                  <p>${escapeHtml(
                    p.skills
                  )}</p>
                </section>
              `
              : ""
          }

          ${
            p.education
              ? `
                <section>
                  <h2>Education</h2>
                  <p>${escapeHtml(
                    p.education
                  )}</p>
                </section>
              `
              : ""
          }

          ${
            p.services
              ? `
                <section>
                  <h2>Services</h2>
                  <p>${escapeHtml(
                    p.services
                  )}</p>
                </section>
              `
              : ""
          }

          ${
            projects
              ? `
                <section>
                  <h2>Projects</h2>
                  ${projects}
                </section>
              `
              : ""
          }

          <section>
            <h2>Contact</h2>
            <p>
              ${escapeHtml(
                [p.email, p.phone, p.location]
                  .filter(Boolean)
                  .join(" · ")
              )}
            </p>
          </section>

          <footer>
            Project by Muzammil Khalid
          </footer>

        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("PUBLIC PAGE ERROR:", error);

    res.status(500).send("Unable to load portfolio.");
  }
});

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

/* =========================================================
   MULTER ERROR
========================================================= */

app.use(function (error, req, res, next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Request failed.",
    });
  }

  next();
});

/* =========================================================
   404
========================================================= */

app.use(function (req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});



/* =========================================================
   LOCAL SERVER
========================================================= */

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", function () {
    console.log("");
    console.log("=================================");
    console.log(" MongoDB / Portfolio Builder");
    console.log(" Local Backend");
    console.log("=================================");
    console.log("");

    console.log(
      `Server running on http://localhost:${PORT}`
    );

    console.log(
      `Network API: http://192.168.100.132:${PORT}/api/health`
    );
  });
}

/* =========================================================
   VERCEL EXPORT
========================================================= */

module.exports = app;