const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    audience_reach: {
      type: Number,
      required: true,
    },
    ideal: {
      type: String,
      required: true,
    },
    media_sites: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
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

module.exports = mongoose.model("Location", locationSchema);
