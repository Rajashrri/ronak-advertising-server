const mongoose = require("mongoose");

const mediaCoverageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    publishedDate: {
      type: Date,
    },

    sourceName: {
      type: String,
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