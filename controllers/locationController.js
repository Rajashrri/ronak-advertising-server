const Location = require("../models/Location");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

// ================= ADD =================

const addLocation = async (req, res) => {
  try {
    const { locationName } = req.body;

    if (!locationName) {
      return res.status(400).json({
        success: false,
        message: "Location Name is required",
      });
    }

    if (!req.files?.image?.length) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const image = await uploadToCloudinary(
      req.files.image[0].path,
      "locations"
    );

    const location = await Location.create({
      locationName,
      image,
      status: 1,
    });

    res.status(201).json({
      success: true,
      message: "Location added successfully",
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LIST =================

const listLocations = async (req, res) => {
  try {
    const data = await Location.find().sort({
      createdAt: -1,
    });

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

// ================= DETAIL =================

const locationDetail = async (req, res) => {
  try {
    const data = await Location.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
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

// ================= UPDATE =================

const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    location.locationName = req.body.locationName;

    if (req.files?.image?.length) {

      if (location.image) {
        await deleteFromCloudinary(location.image);
      }

      location.image = await uploadToCloudinary(
        req.files.image[0].path,
        "locations"
      );
    }

    await location.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE =================

const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    if (location.image) {
      await deleteFromCloudinary(location.image);
    }

    await Location.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Location deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= STATUS =================

const changeStatus = async (req, res) => {
  try {

    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    location.status = location.status === 1 ? 0 : 1;

    await location.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      data: location,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  addLocation,
  listLocations,
  locationDetail,
  updateLocation,
  deleteLocation,
  changeStatus,
};