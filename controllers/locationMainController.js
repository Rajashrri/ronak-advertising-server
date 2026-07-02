const LocationMain = require("../models/LocationMain");
const Location = require("../models/Location");

const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

// =============================
// ADD LOCATION MAIN
// =============================

const addLocationMain = async (req, res) => {
  try {
    const {
      locationId,
      siteName,
      ytVideoLink,
      detail,
      media,
      type,
      siteCode,
      latitude,
      longitude,
    } = req.body;

    if (!locationId || !siteName) {
      return res.status(400).json({
        success: false,
        message: "Location and Site Name are required.",
      });
    }

    if (!req.files?.image?.length) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    // Upload Featured Image
    const image = await uploadToCloudinary(
      req.files.image[0].path,
      "location-main"
    );

    // Upload Gallery Images
    let galleryImages = [];

    if (req.files.gallery) {
      for (const file of req.files.gallery) {
        const url = await uploadToCloudinary(
          file.path,
          "location-main/gallery"
        );

        galleryImages.push(url);
      }
    }

    const locationMain = await LocationMain.create({
      locationId,
      siteName,
      image,
      ytVideoLink,
      mediaGallery: galleryImages,
      detail,
      media,
      type,
      siteCode,
      latitude,
      longitude,
      status: 1,
    });

    res.status(201).json({
      success: true,
      message: "Location added successfully.",
      data: locationMain,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// LIST
// =============================

const listLocationMain = async (req, res) => {
  try {

    const data = await LocationMain.find()
      .populate("locationId", "locationName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// DETAIL
// =============================

const locationMainDetail = async (req, res) => {
  try {

    const data = await LocationMain.findById(req.params.id)
      .populate("locationId", "locationName");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    res.json({
      success: true,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// ACTIVE LOCATIONS
// =============================

const getActiveLocations = async (req, res) => {
  try {

    const locations = await Location.find({
      status: 1,
    })
      .select("_id locationName")
      .sort({
        locationName: 1,
      });

    res.json({
      success: true,
      data: locations,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// UPDATE
// =============================

const updateLocationMain = async (req, res) => {
  try {

    const {
      locationId,
      siteName,
      ytVideoLink,
      detail,
      media,
      type,
      siteCode,
      latitude,
      longitude,
    } = req.body;

    const locationMain = await LocationMain.findById(req.params.id);

    if (!locationMain) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    locationMain.locationId = locationId;
    locationMain.siteName = siteName;
    locationMain.ytVideoLink = ytVideoLink;
    locationMain.detail = detail;
    locationMain.media = media;
    locationMain.type = type;
    locationMain.siteCode = siteCode;
    locationMain.latitude = latitude;
    locationMain.longitude = longitude;

    // ================= Featured Image =================

    if (req.files?.image?.length) {

      if (locationMain.image) {
        await deleteFromCloudinary(locationMain.image);
      }

      locationMain.image = await uploadToCloudinary(
        req.files.image[0].path,
        "location-main"
      );
    }

    // ================= Gallery =================

  // ================= Gallery =================

if (req.files?.gallery?.length) {

  // Existing gallery images ko preserve karo
  const gallery = [...locationMain.mediaGallery];

  // Upload new images and append
  for (const file of req.files.gallery) {

    const imageUrl = await uploadToCloudinary(
      file.path,
      "location-main/gallery"
    );

    gallery.push(imageUrl);

  }

  // Save old + new images
  locationMain.mediaGallery = gallery;

}

    await locationMain.save();

    res.json({
      success: true,
      message: "Location updated successfully.",
      data: locationMain,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// DELETE
// =============================

const deleteLocationMain = async (req, res) => {
  try {

    const locationMain = await LocationMain.findById(req.params.id);

    if (!locationMain) {

      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });

    }

    // Delete Main Image

    if (locationMain.image) {
      await deleteFromCloudinary(locationMain.image);
    }

    // Delete Gallery Images

    if (locationMain.mediaGallery.length) {

      for (const img of locationMain.mediaGallery) {
        await deleteFromCloudinary(img);
      }

    }

    await LocationMain.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Location deleted successfully.",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// CHANGE STATUS
// =============================

const changeStatus = async (req, res) => {
  try {

    const locationMain = await LocationMain.findById(req.params.id);

    if (!locationMain) {

      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });

    }

    locationMain.status =
      locationMain.status === 1 ? 0 : 1;

    await locationMain.save();

    res.json({
      success: true,
      message: "Status updated successfully.",
      data: locationMain,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

const deleteGalleryImage = async (req, res) => {
  try {

    const { image } = req.body;

    const location = await LocationMain.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found.",
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(image);

    // Remove from MongoDB array
    location.mediaGallery = location.mediaGallery.filter(
      (img) => img !== image
    );

    await location.save();

    res.json({
      success: true,
      message: "Image deleted successfully.",
      mediaGallery: location.mediaGallery,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
module.exports = {
  addLocationMain,
  listLocationMain,
  locationMainDetail,
  updateLocationMain,
  deleteLocationMain,
  changeStatus,
  getActiveLocations,
  deleteGalleryImage
};