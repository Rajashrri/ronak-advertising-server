const express = require("express");

const router = express.Router();

const locationMainBulkUpload =
  require("../middlewares/locationMainBulkUpload");

const {
  bulkUploadLocationMain,
  getLocationMainBulkUploadList,
  getLocationMainBulkUploadDetail,downloadLocationMainBulkUploadExcel
} = require(
  "../controllers/locationMainBulkUploadController"
);
// DOWNLOAD EXCEL
router.get(
  "/download/:id",
  downloadLocationMainBulkUploadExcel
);
// ======================================
// LIST
// ======================================

router.get(
  "/list",
  getLocationMainBulkUploadList
);

// ======================================
// DETAIL
// ======================================

router.get(
  "/detail/:id",
  getLocationMainBulkUploadDetail
);

// ======================================
// UPLOAD
// ======================================

router.post(
  "/upload",
  locationMainBulkUpload.fields([
     { name: "excel", maxCount: 1 },
  { name: "mainZip", maxCount: 1 },
  { name: "galleryZip", maxCount: 1 },
  ]),
  bulkUploadLocationMain
);

module.exports = router;