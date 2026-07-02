const express = require("express");

const router = express.Router();

const locationUpload = require("../middlewares/locationMainUpload");

const {
  addLocationMain,
  listLocationMain,
  locationMainDetail,
  updateLocationMain,
  deleteLocationMain,
  changeStatus,
  getActiveLocations,
  deleteGalleryImage
} = require("../controllers/locationMainController");

// ==========================
// ADD
// ==========================
router.post(
  "/add-location-main",
  locationUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "gallery",
      maxCount: 20,
    },
  ]),
  addLocationMain
);

// ==========================
// LIST
// ==========================
router.get(
  "/list-location-main",
  listLocationMain
);

// ==========================
// ACTIVE LOCATIONS
// (Location Master status=1)
// ==========================
router.get(
  "/active-locations",
  getActiveLocations
);

// ==========================
// DETAIL
// ==========================
router.get(
  "/location-main-detail/:id",
  locationMainDetail
);

// ==========================
// UPDATE
// ==========================
router.put(
  "/update-location-main/:id",
  locationUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "gallery",
      maxCount: 20,
    },
  ]),
  updateLocationMain
);

// ==========================
// DELETE
// ==========================
router.delete(
  "/delete-location-main/:id",
  deleteLocationMain
);
router.delete(
  "/delete-gallery-image/:id",
  deleteGalleryImage
);
// ==========================
// STATUS
// ==========================
router.patch(
  "/change-status/:id",
  changeStatus
);

module.exports = router;