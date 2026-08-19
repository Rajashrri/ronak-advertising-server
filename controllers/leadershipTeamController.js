const LeadershipTeam = require("../models/LeadershipTeam");

const { uploadToCloudinary } = require("../utils/upload");

const deleteFromCloudinary = require("../utils/cloudinaryDelete");


// ================= ADD =================

const addLeadershipTeam = async (req, res) => {
  try {

    const {
      name,
      designation,
      experience,
      linkedin,
    } = req.body;

    if (
      !name ||
      !designation ||
      !experience
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (
      !req.files ||
      !req.files.image ||
      !req.files.image.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Image is required.",
      });
    }

    const imageUrl = await uploadToCloudinary(
      req.files.image[0].path,
      "leadership-team"
    );

    const leadership = new LeadershipTeam({
      name,
      designation,
      experience,
      linkedin,
      image: imageUrl,
      status: 1,
    });

    await leadership.save();

    res.status(201).json({
      success: true,
      message: "Leadership member added successfully.",
      data: leadership,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ================= LIST =================
const listLeadershipTeam = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);

    const skip = (pageNumber - 1) * limitNumber;

    // Search by name
    const searchQuery = search
      ? {
          name: {
            $regex: search,
            $options: "i",
          },
        }
      : {};

    // Total records
    const total = await LeadershipTeam.countDocuments(searchQuery);

    // Paginated data
    const data = await LeadershipTeam.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    });
  } catch (error) {
    console.log("Leadership List Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= DETAIL =================

const leadershipTeamDetail = async (req, res) => {

  try {

    const data = await LeadershipTeam.findById(
      req.params.id
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    res.status(200).json({
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

const updateLeadershipTeam = async (req, res) => {

  try {

    const {
      name,
      designation,
      experience,
      linkedin,
    } = req.body;

    const leadership =
      await LeadershipTeam.findById(
        req.params.id
      );

    if (!leadership) {
      return res.status(404).json({
        success: false,
        message: "Leadership member not found.",
      });
    }

    leadership.name = name;
    leadership.designation = designation;
    leadership.experience = experience;
    leadership.linkedin = linkedin;

    if (req.file) {

      const imageUrl =
        await uploadToCloudinary(
          req.file.path,
          "leadership-team"
        );

      if (leadership.image) {
        await deleteFromCloudinary(
          leadership.image
        );
      }

      leadership.image = imageUrl;
    }

    await leadership.save();

    res.status(200).json({
      success: true,
      message:
        "Leadership member updated successfully.",
      data: leadership,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// ================= DELETE =================

const deleteLeadershipTeam = async (req, res) => {

  try {

    const leadership =
      await LeadershipTeam.findById(
        req.params.id
      );

    if (!leadership) {
      return res.status(404).json({
        success: false,
        message: "Leadership member not found.",
      });
    }

    if (leadership.image) {

      await deleteFromCloudinary(
        leadership.image
      );

    }

    await LeadershipTeam.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Leadership member deleted successfully.",
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

    const leadership =
      await LeadershipTeam.findById(
        req.params.id
      );

    if (!leadership) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    leadership.status =
      leadership.status === 1 ? 0 : 1;

    await leadership.save();

    res.status(200).json({
      success: true,
      message:
        "Status updated successfully.",
      data: leadership,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


module.exports = {
  addLeadershipTeam,
  listLeadershipTeam,
  leadershipTeamDetail,
  updateLeadershipTeam,
  deleteLeadershipTeam,
  changeStatus,
};