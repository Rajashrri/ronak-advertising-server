const mongoose = require("mongoose");

const caseStudySchema = new mongoose.Schema(
  {
    industry: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      default: "",
      trim: true,
    },

    featuredImage: {
      type: String,
      default: "",
    },

    featuredImageAlt: {
      type: String,
      default: "",
    },

    briefIntro: {
      type: String,
      required: true,
      trim: true,
    },

    detail: {
      type: String,
      required: true,
    },

    metaTitle: {
      type: String,
      default: "",
    },

    metaKeywords: {
      type: String,
      default: "",
    },

    metaDescription: {
      type: String,
      default: "",
    },

    schemaCode: {
      type: String,
      default: "",
    },

    featured: {
      type: Number,
      default: 0,
    },

    status: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CaseStudy", caseStudySchema);