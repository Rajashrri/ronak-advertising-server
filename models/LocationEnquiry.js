const mongoose = require("mongoose");

const locationEnquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    siteName: {
      type: String,
      required: true,
    },
    siteCode: {
      type: String,
    },

    companyname: {
      type: String,
    },
    mediaType: {
      type: String,
    },
    location: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("LocationEnquiry", locationEnquirySchema);
