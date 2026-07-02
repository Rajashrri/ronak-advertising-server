const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    },

    briefIntro: {
      type: String,
      required: true,
    },

    articleLink: {
      type: String,
      required: true,
    },

    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);