const Blog = require("../models/Blog");
const BlogCategory = require("../models/BlogCategory");
const Contact = require("../models/contact-model");
const sendMail = require("../utils/sendMail");
const Career = require("../models/Career");

const fs = require("fs");
const cloudinary = require("../utils/cloudinary");
const uploadResume = async (filePath) => {
  const result = await cloudinary.uploader.upload(
    filePath,
    {
      folder: "resume",
      resource_type: "raw",
       type: "upload", // public delivery
  access_mode: "public",
    }
  );

  fs.unlinkSync(filePath);

  return result.secure_url;
};

const addCareer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      experience,
      location,
      position,
      coverLetter,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !mobile ||
      !experience ||
       !position ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be 10 digits",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume is required",
      });
    }

    // Upload Resume To Cloudinary
    const resumeUrl = await uploadResume(req.file.path);

    // Save Database
    const career = await Career.create({
      fullName,
      email,
      mobile,
      experience,
      location,
      coverLetter,
      position,
      resume: resumeUrl,
    });

    // SUCCESS RESPONSE IMMEDIATELY
    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      data: career,
    });

    // SEND MAIL IN BACKGROUND
    sendMail(
      email,
      "rajashri@digihost.in",
      "New Career Application",
      `
      <p><b>Dear Admin,</b></p>

      <p>A new career application has been submitted.</p>

      <h3>Candidate Details</h3>

      <p><b>Name:</b> ${fullName}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Mobile:</b> ${mobile}</p>
      <p><b>Experience:</b> ${experience}</p>
      <p><b>Location:</b> ${location}</p>
            <p><b>Apply For The Position:</b> ${position}</p>

      <p><b>Cover Letter:</b> ${coverLetter || "-"}</p>

      <p>
        <b>Resume:</b>
        <a href="${resumeUrl}" target="_blank">
          View Resume
        </a>
      </p>

      <br>
      <p>Regards,<br><b>DIGIIHOST</b></p>
      `
    ).catch((err) => {
      console.log("Career Mail Error:", err.message);
    });

  } catch (error) {
    console.log("Career Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const addContact = async (req, res) => {
  try {
    const { fullName, phone, email, message } = req.body;

    if (!fullName || !phone || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      fullName,
      phone,
      email,
      message,
    });

    // Mail send separately
    try {
      await sendMail(
        email,
        "rajashri@digihost.in",

        "New Contact Inquiry",
        `
        <p><b>Dear Admin,</b></p>

        <p>A new contact enquiry has been submitted through the website.</p>

        <p>You have received a new enquiry from <b>${fullName}</b>.</p>

        <h3>Details:</h3>

        <p><b>Name:</b> ${fullName}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b> ${message}</p>

        <br>

        <p>Regards,<br><b>DIGIIHOST</b></p>
        `
      );
    } catch (mailError) {
      console.error("Mail Error:", mailError.message);
      // Sirf log karo, API fail mat karo
    }

    return res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({
      status: 1,
    })
      .populate("categoryId", "categoryName slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getBlogDetails = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 1,
    }).populate("categoryId", "categoryName slug");

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


const getBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find({
      status: 1,
    }).sort({
      categoryName: 1,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};




module.exports = {
  getBlogs,
  getBlogDetails,
  getBlogCategories,
  addContact,
  addCareer
};