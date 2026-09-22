
const express = require("express");
const router = express.Router();
const locationBulkUpload =
  require("../middlewares/locationBulkUpload");

const {
  bulkUploadLocations,
  getBulkUploadList,downloadExcel
} = require("../controllers/locationBulkUploadController");


router.get(
  "/download/:id",
  downloadExcel
);
// GET
// /api/location-bulk-upload/list
router.get(
  "/list",
  getBulkUploadList
);


/*
POST
/api/location-bulk-upload/upload
*/
router.post(
  "/upload",

  locationBulkUpload.fields([
    {
      name: "excel",
      maxCount: 1,
    },
    {
      name: "zip",
      maxCount: 1,
    },
  ]),

  bulkUploadLocations
);


module.exports = router;