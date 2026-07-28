const MediaCoverage = require("../models/MediaCoverage");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

// =======================
// Add Media Coverage
// =======================

const addMediaCoverage = async (req, res) => {
  try {
    const { name, publishedDate, sourceName } = req.body;

    if (!name || !publishedDate || !sourceName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (!req.files || !req.files.image || !req.files.image.length) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    const image = await uploadToCloudinary(
      req.files.image[0].path,
      "media-coverage",
    );

    const media = await MediaCoverage.create({
      name,
      publishedDate,
      sourceName,
      image,
      status: 1,
    });

    res.status(201).json({
      success: true,
      message: "Media Coverage added successfully.",
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// List
// =======================

const listMediaCoverage = async (req, res) => {
  try {
    const media = await MediaCoverage.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Detail
// =======================

const mediaCoverageDetail = async (req, res) => {
  try {
    const media = await MediaCoverage.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media Coverage not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Update
// =======================

const updateMediaCoverage = async (req, res) => {
  try {
    const { name, publishedDate, sourceName } = req.body;

    const media = await MediaCoverage.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media Coverage not found.",
      });
    }

    media.name = name;
    media.publishedDate = publishedDate;
    media.sourceName = sourceName;

    if (req.files && req.files.image && req.files.image.length) {
      if (media.image) {
        await deleteFromCloudinary(media.image);
      }

      media.image = await uploadToCloudinary(
        req.files.image[0].path,
        "media-coverage",
      );
    }

    await media.save();

    res.status(200).json({
      success: true,
      message: "Media Coverage updated successfully.",
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Delete
// =======================

const deleteMediaCoverage = async (req, res) => {
  try {
    const media = await MediaCoverage.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media Coverage not found.",
      });
    }

    if (media.image) {
      await deleteFromCloudinary(media.image);
    }

    await MediaCoverage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Media Coverage deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// Status Toggle
// =======================

const changeMediaCoverageStatus = async (req, res) => {
  try {
    const media = await MediaCoverage.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media Coverage not found.",
      });
    }

    media.status = media.status === 1 ? 0 : 1;

    await media.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const changeMediaCoverageFeatured = async (req, res) => {
  try {
    const media = await MediaCoverage.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media Coverage not found.",
      });
    }

    media.featured = media.featured === 1 ? 0 : 1;

    await media.save();

    res.status(200).json({
      success: true,
      message: "Featured updated successfully.",
      data: media,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  addMediaCoverage,
  listMediaCoverage,
  mediaCoverageDetail,
  updateMediaCoverage,
  deleteMediaCoverage,
  changeMediaCoverageStatus,
  changeMediaCoverageFeatured
};
