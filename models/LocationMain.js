const mongoose = require("mongoose");

const locationMainSchema = new mongoose.Schema(
  {
    // Location Master Reference
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    // Basic Information
    siteName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: true,
    },

    ytVideoLink: {
      type: String,
      default: "",
      trim: true,
    },

    mediaGallery: [
      {
        type: String,
      },
    ],

    detail: {
      type: String,
      default: "",
    },

    // Site Information
    media: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "",
      trim: true,
    },

    siteCode: {
      type: String,
      default: "",
      trim: true,
    },

    latitude: {
      type: String,
      default: "",
      trim: true,
    },

    longitude: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LocationMain", locationMainSchema);
