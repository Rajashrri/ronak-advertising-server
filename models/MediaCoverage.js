const mongoose = require("mongoose");

const mediaCoverageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    publishedDate: {
      type: Date,
      required: true,
    },

    sourceName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    featured: {
  type: Number,
  default: 0,
  enum: [0, 1],
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MediaCoverage",
  mediaCoverageSchema
);