const CoreTeam = require("../models/CoreTeam");

const { uploadToCloudinary } = require("../utils/upload");

const deleteFromCloudinary = require("../utils/cloudinaryDelete");


// ================= ADD =================

const addCoreTeam = async (req, res) => {
  try {

    const {
      name,
      designation,
    } = req.body;

    if (!name || !designation) {
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
      "core-team"
    );

    const member = new CoreTeam({
      name,
      designation,
      image: imageUrl,
      status: 1,
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: "Core Team member added successfully.",
      data: member,
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

const listCoreTeam = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const skip = (pageNumber - 1) * limitNumber;

    // Search condition
    const searchCondition = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { designation: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Total records
    const total = await CoreTeam.countDocuments(searchCondition);

    // Paginated data
    const data = await CoreTeam.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      data,
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


// ================= DETAIL =================

const coreTeamDetail = async (req, res) => {

  try {

    const data = await CoreTeam.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
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

const updateCoreTeam = async (req, res) => {

  try {

    const {
      name,
      designation,
    } = req.body;

    const member = await CoreTeam.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    member.name = name;
    member.designation = designation;

    if (req.file) {

      const imageUrl = await uploadToCloudinary(
        req.file.path,
        "core-team"
      );

      if (member.image) {
        await deleteFromCloudinary(member.image);
      }

      member.image = imageUrl;
    }

    await member.save();

    res.status(200).json({
      success: true,
      message: "Core Team member updated successfully.",
      data: member,
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

const deleteCoreTeam = async (req, res) => {

  try {

    const member = await CoreTeam.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    if (member.image) {
      await deleteFromCloudinary(member.image);
    }

    await CoreTeam.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Core Team member deleted successfully.",
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

    const member = await CoreTeam.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    member.status = member.status === 1 ? 0 : 1;

    await member.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: member,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


module.exports = {
  addCoreTeam,
  listCoreTeam,
  coreTeamDetail,
  updateCoreTeam,
  deleteCoreTeam,
  changeStatus,
};