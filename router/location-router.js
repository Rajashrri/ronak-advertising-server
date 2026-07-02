const express = require("express");
const router = express.Router();

const locationUpload = require("../middlewares/locationUpload");

const {
  addLocation,
  listLocations,
  locationDetail,
  updateLocation,
  deleteLocation,
  changeStatus,
} = require("../controllers/locationController");

// ================= ADD =================
router.post(
  "/add-location",
  locationUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addLocation
);

// ================= LIST =================
router.get("/list-location", listLocations);

// ================= DETAIL =================
router.get("/location-detail/:id", locationDetail);

// ================= UPDATE =================
router.put(
  "/update-location/:id",
  locationUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateLocation
);

// ================= DELETE =================
router.delete("/delete-location/:id", deleteLocation);

// ================= STATUS =================
router.patch("/change-status/:id", changeStatus);

module.exports = router;