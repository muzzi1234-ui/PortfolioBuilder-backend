const mongoose = require("mongoose");

/* =========================================================
   PROJECT
========================================================= */

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "",
      trim: true,
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
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   CUSTOM SECTION
========================================================= */

const customSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
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

/* =========================================================
   PORTFOLIO SCHEMA
========================================================= */

const portfolioSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------------
       OWNER
    ------------------------------------------------------- */

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
      Legacy compatibility.

      Older portfolios may have been stored using "user".
      We keep the field so old data does not become invalid.
    */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    /* -------------------------------------------------------
       BASIC INFORMATION
    ------------------------------------------------------- */

    name: {
      type: String,
      trim: true,
      default: "",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    headline: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    /* -------------------------------------------------------
       CONTACT INFORMATION
    ------------------------------------------------------- */

    email: {
      type: String,
      trim: true,
      lowercase: true,
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

    /* -------------------------------------------------------
       SOCIAL LINKS
    ------------------------------------------------------- */

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

    /* -------------------------------------------------------
       PROFESSIONAL INFORMATION

       Mixed is intentional here because the mobile builder
       supports both simple text and structured information.
    ------------------------------------------------------- */

    skills: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    education: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    experience: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    services: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    achievements: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    certifications: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    languages: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    interests: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    /* -------------------------------------------------------
       PROJECTS
    ------------------------------------------------------- */

    projects: {
      type: [projectSchema],
      default: [],
    },

    /* -------------------------------------------------------
       CUSTOM SECTIONS
    ------------------------------------------------------- */

    customSections: {
      type: [customSectionSchema],
      default: [],
    },

    /* -------------------------------------------------------
       TEMPLATE

       Main app templates:
       template-1 through template-50

       Legacy template names are also temporarily accepted
       so older drafts do not fail validation.
    ------------------------------------------------------- */

    template: {
      type: String,
      default: "template-1",
      trim: true,

      validate: {
        validator: function (value) {
          if (!value) {
            return true;
          }

          if (/^template-(?:[1-9]|[1-4][0-9]|50)$/.test(value)) {
            return true;
          }

          /*
            Legacy template names used by earlier app versions.
          */
          const legacyTemplates = [
            "executive",
            "minimal",
            "modern",
            "creative",
            "professional",
            "classic",
            "elegant",
            "portfolio",
            "resume",
            "sidebar",
            "timeline",
            "cards",
            "hero",
            "bento",
            "split",
            "editorial",
          ];

          return legacyTemplates.includes(value);
        },

        message: "Invalid portfolio template.",
      },
    },

    /* -------------------------------------------------------
       PUBLISHING
    ------------------------------------------------------- */

    published: {
      type: Boolean,
      default: false,
    },

    /* -------------------------------------------------------
       PUBLIC URL
    ------------------------------------------------------- */

    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    publicUrl: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = mongoose.model("Portfolio", portfolioSchema);