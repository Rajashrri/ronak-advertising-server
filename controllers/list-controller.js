
const Contact = require("../models/contact-model");
const Career = require("../models/Career");
const Newsletter = require("../models/Newsletter");

const getNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: newsletter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL CONTACTS
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: careers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
module.exports = {
  getCareers,
  getContacts,getNewsletter
};