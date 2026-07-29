const mongoose = require("mongoose");

const CaseStudyTestimonialSchema = new mongoose.Schema(
  {
    caseStudyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaseStudy",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    briefIntro: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: Number,
      default: 1,
    },

    // SEO
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

    imageAlt: {
      type: String,
      default: "",
    },

    schemaCode: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CaseStudyTestimonial",
  CaseStudyTestimonialSchema
);