const MediaCoverage = require("../models/MediaCoverage");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

// =======================
// Add Media Coverage
// =======================

const addMediaCoverage = async (req, res) => {
  try {
    const { name, publishedDate, sourceName,briefIntro } = req.body;

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
    // Image Preview
    let imagePreview = "";

    if (req.files.imagePreview && req.files.imagePreview.length) {
      imagePreview = await uploadToCloudinary(
        req.files.imagePreview[0].path,
        "media-coverage-preview",
      );
    }
    const media = await MediaCoverage.create({
      name,
      publishedDate,
      sourceName,
      image,
      imagePreview,
      briefIntro,
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
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const searchCondition = search
      ? {
          $or: [
            {
              name: {
                $regex: search,
                $options: "i",
              },
            },
            {
              sourceName: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const total = await MediaCoverage.countDocuments(searchCondition);

    const media = await MediaCoverage.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      data: media,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
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
    const { name, publishedDate, sourceName,briefIntro } = req.body;

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
    media.briefIntro = briefIntro;

    // =========================
    // Main Image
    // =========================
    if (
      req.files &&
      req.files.image &&
      req.files.image.length
    ) {
      // Delete old image
      if (media.image) {
        await deleteFromCloudinary(media.image);
      }

      // Upload new image
      media.image = await uploadToCloudinary(
        req.files.image[0].path,
        "media-coverage"
      );
    }

    // =========================
    // Image Preview
    // =========================
    if (
      req.files &&
      req.files.imagePreview &&
      req.files.imagePreview.length
    ) {
      // Delete old preview image
      if (media.imagePreview) {
        await deleteFromCloudinary(media.imagePreview);
      }

      // Upload new preview image
      media.imagePreview = await uploadToCloudinary(
        req.files.imagePreview[0].path,
        "media-coverage-preview"
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

    // Agar currently non-featured hai aur featured karna hai
    if (media.featured === 0) {
      const featuredCount = await MediaCoverage.countDocuments({
        featured: 1,
      });

      if (featuredCount >= 3) {
        return res.status(400).json({
          success: false,
          message: "Only 3 media coverages can be featured.",
        });
      }

      media.featured = 1;
    } else {
      // Unfeature karna ho to allow karo
      media.featured = 0;
    }

    await media.save();

    return res.status(200).json({
      success: true,
      message: "Featured updated successfully.",
      data: media,
    });
  } catch (error) {
    return res.status(500).json({
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
  changeMediaCoverageFeatured,
};
