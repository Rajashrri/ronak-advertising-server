const mongoose = require("mongoose");

const clienteleSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    clientLogo: {
      type: String,
      required: true,
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

module.exports = mongoose.model("Clientele", clienteleSchema);