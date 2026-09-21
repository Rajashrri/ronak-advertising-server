const mongoose = require("mongoose");

const locationMainBulkUploadSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    excelFile: {
      type: String,
      default: "",
    },

    zipFile: {
      type: String,
      default: "",
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    successRecords: {
      type: Number,
      default: 0,
    },

    failedRecords: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Processing",
    },

    errorLog: [
      {
        rowNo: Number,
        locationName: String,
        message: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LocationMainBulkUpload",
  locationMainBulkUploadSchema
);