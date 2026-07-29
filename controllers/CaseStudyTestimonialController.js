const CaseStudyTestimonial = require("../models/CaseStudyTestimonial");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

const addCaseStudyTestimonial = async (req, res) => {
  try {
    const {
      caseStudyId,
      name,
      designation,
      briefIntro,
    } = req.body;

    let image = "";

    if (req.files?.image?.[0]) {
      image = await uploadToCloudinary(
        req.files.image[0].path,
        "case-study-testimonial"
      );
    }

    const testimonial = new CaseStudyTestimonial({
      caseStudyId,
      name,
      designation,
      briefIntro,
      image,
    });

    await testimonial.save();

    return res.status(201).json({
      success: true,
      message: "Case Study Testimonial added successfully",
      data: testimonial,
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
    const testimonials = await CaseStudyTestimonial.find({
      caseStudyId: req.params.caseStudyId,
    })
      .populate("caseStudyId", "name")
      .sort({ createdAt: -1 });

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

const getCaseStudyTestimonialById = async (req, res) => {
  try {
    const testimonial = await CaseStudyTestimonial.findById(req.params.id)
      .populate("caseStudyId", "name");

    return res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateCaseStudyTestimonial = async (req, res) => {
  try {
    const testimonial =
      await CaseStudyTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    const updateData = {
      name: req.body.name,
      designation: req.body.designation,
      briefIntro: req.body.briefIntro,
    };

    if (req.files?.image?.[0]) {
      if (testimonial.image) {
        await deleteFromCloudinary(testimonial.image);
      }

      updateData.image = await uploadToCloudinary(
        req.files.image[0].path,
        "case-study-testimonial"
      );
    }

    await CaseStudyTestimonial.findByIdAndUpdate(
      req.params.id,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Case Study Testimonial updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCaseStudyTestimonial = async (req, res) => {
  try {
    const testimonial =
      await CaseStudyTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    if (testimonial.image) {
      await deleteFromCloudinary(testimonial.image);
    }

    await CaseStudyTestimonial.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Case Study Testimonial deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changeCaseStudyTestimonialStatus = async (
  req,
  res
) => {
  try {
    const testimonial =
      await CaseStudyTestimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    testimonial.status =
      testimonial.status === 1 ? 0 : 1;

    await testimonial.save();

    return res.status(200).json({
      success: true,
      message:
        testimonial.status === 1
          ? "Testimonial Activated Successfully"
          : "Testimonial Deactivated Successfully",
      data: testimonial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSeoById = async (req, res) => {
  try {
    const testimonial =
      await CaseStudyTestimonial.findById(req.params.id);

    return res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const updateSeo = async (req, res) => {
  try {
    const {
      metaTitle,
      metaKeywords,
      metaDescription,
      imageAlt,
      schemaCode,
    } = req.body;

    await CaseStudyTestimonial.findByIdAndUpdate(
      req.params.id,
      {
        metaTitle,
        metaKeywords,
        metaDescription,
        imageAlt,
        schemaCode,
      }
    );

    return res.status(200).json({
      success: true,
      message: "SEO Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addCaseStudyTestimonial,
  getCaseStudyTestimonials,
  getCaseStudyTestimonialById,
  updateCaseStudyTestimonial,
  deleteCaseStudyTestimonial,
  changeCaseStudyTestimonialStatus,
  getSeoById,
  updateSeo,
};