const express = require("express");
const router = express.Router();

const mediaCoverageUpload = require("../middlewares/mediaCoverageUpload");

const {
  addMediaCoverage,
  listMediaCoverage,
  mediaCoverageDetail,
  updateMediaCoverage,
  deleteMediaCoverage,
  changeMediaCoverageStatus,
} = require("../controllers/mediaCoverageController");

// Add
router.post(
  "/add-media-coverage",
  mediaCoverageUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addMediaCoverage
);

// List
router.get(
  "/list-media-coverage",
  listMediaCoverage
);

// Detail
router.get(
  "/media-coverage-detail/:id",
  mediaCoverageDetail
);

// Update
router.put(
  "/update-media-coverage/:id",
  mediaCoverageUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateMediaCoverage
);

// Delete
router.delete(
  "/delete-media-coverage/:id",
  deleteMediaCoverage
);

// Status Toggle
router.patch(
  "/change-status/:id",
  changeMediaCoverageStatus
);

module.exports = router;