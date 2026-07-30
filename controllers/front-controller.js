const Blog = require("../models/Blog");
const BlogCategory = require("../models/BlogCategory");
const Contact = require("../models/contact-model");
const sendMail = require("../utils/sendMail");
const Career = require("../models/Career");
const Testimonial = require("../models/Testimonial");
const Clientele = require("../models/Clientele");
const MediaCoverage = require("../models/MediaCoverage");
const Article = require("../models/Article");
const Location = require("../models/Location");
const CaseStudy = require("../models/CaseStudy");
const CaseStudyTestimonial = require("../models/CaseStudyTestimonial");
const Newsletter = require("../models/Newsletter");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary");
const uploadResume = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "resume",
    resource_type: "raw",
    type: "upload", // public delivery
    access_mode: "public",
  });

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
      `,
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
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    const exist = await Newsletter.findOne({ email });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Email already subscribed",
      });
    }

    const subscriber = await Newsletter.create({
      email,
    });

    // response first
    res.status(200).json({
      success: true,
      message: "Subscribed successfully",
      data: subscriber,
    });

    // Mail in background
    sendMail(
      email,
      "rajashri@digihost.in",
      "Newsletter Subscription",
      `
      <p><b>Dear Admin,</b></p>

      <p>A new newsletter subscription has been received.</p>

      <p><b>Email :</b> ${email}</p>

      <br>

      <p>Regards,<br><b>Ronak Advertising</b></p>
      `,
    ).catch((err) => {
      console.log("Newsletter Mail Error :", err.message);
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
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

    // Return response immediately
    res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });

    // Send mail in background
    sendMail(
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

  <p>Regards,<br><b>Ronak Advertising</b></p>
  `,
    ).catch((err) => {
      console.error("Background Mail Error:", err);
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
    const filter = { status: 1 };

    if (req.query.category) {
      const category = await BlogCategory.findOne({
        slug: req.query.category,
        status: 1,
      });

      if (category) {
        filter.categoryId = category._id;
      }
    }

    const blogs = await Blog.find(filter)
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

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Related Blogs (same category, current blog exclude)
    const relatedBlogs = await Blog.find({
      status: 1,
      categoryId: blog.categoryId._id,
      _id: { $ne: blog._id },
    })
      .populate("categoryId", "categoryName slug")
      .sort({ createdAt: -1 })
      .limit(3);

    return res.status(200).json({
      success: true,
      data: blog,
      relatedBlogs,
    });
  } catch (error) {
    console.log(error);

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

const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({
      status: 1,
      featured: 1,
    })
      .populate("categoryId", "categoryName slug")
      .sort({ createdAt: -1 })
      .limit(3);

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

const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      status: 1,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getClients = async (req, res) => {
  try {
    const clients = await Clientele.find({ status: 1 })
      .select("clientName clientLogo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeaturedMedia = async (req, res) => {
  try {
    const media = await MediaCoverage.find({
      status: 1,
      featured: 1,
    })
      .sort({ createdAt: -1 })
      .limit(2);

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

const getMediaCoverage = async (req, res) => {
  try {
    const media = await MediaCoverage.find({
      status: 1,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      status: 1,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({
      status: 1,
    })
      .select("locationName image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCaseStudies = async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find({
      status: 1,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: caseStudies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCaseStudyDetail = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findOne({
      slug: req.params.slug,
      status: 1,
    });

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case Study not found",
      });
    }

    // Current case ko exclude karke latest 2 case studies
    const relatedCaseStudies = await CaseStudy.find({
      status: 1,
      _id: { $ne: caseStudy._id },
    })
      .sort({ createdAt: -1 })
      .limit(2);

    return res.status(200).json({
      success: true,
      data: caseStudy,
      relatedCaseStudies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCaseStudyTestimonials = async (req, res) => {
  try {
    const { slug } = req.params;

    const caseStudy = await CaseStudy.findOne({
      slug,
      status: 1,
    });

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case study not found",
      });
    }

    const testimonials = await CaseStudyTestimonial.find({
      caseStudyId: caseStudy._id,
      status: 1,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getBlogs,
  getBlogDetails,
  getBlogCategories,
  addContact,
  addCareer,
  subscribeNewsletter,
  getFeaturedBlogs,
  getTestimonials,
  getClients,
  getFeaturedMedia,
  getMediaCoverage,
  getArticles,
  getLocations,
  getCaseStudies,
  getCaseStudyDetail,
  getCaseStudyTestimonials,
};
