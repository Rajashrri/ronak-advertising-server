const CaseStudy = require("../models/CaseStudy");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

const addCaseStudy = async (req, res) => {
  try {
    const {
      industry,
      name,
      slug,
      briefIntro,
      detail,
    } = req.body;

    let featuredImage = "";

    if (req.files?.featuredImage?.[0]) {
      featuredImage = await uploadToCloudinary(
        req.files.featuredImage[0].path,
        "case-study/featured"
      );
    }

    const caseStudy = new CaseStudy({
      industry,
      name,
      slug,
      featuredImage,
      briefIntro,
      detail,
    });

    await caseStudy.save();

    return res.status(201).json({
      success: true,
      message: "Case Study added successfully",
      data: caseStudy,
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
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const searchCondition = search
      ? {
          $or: [
            {
              industry: {
                $regex: search,
                $options: "i",
              },
            },
            {
              name: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const total = await CaseStudy.countDocuments(
      searchCondition
    );

    const caseStudies = await CaseStudy.find(
      searchCondition
    )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      data: caseStudies,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCaseStudyById = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);

    return res.status(200).json({
      success: true,
      data: caseStudy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case Study not found",
      });
    }

    const updateData = {
      industry: req.body.industry,
      name: req.body.name,
      slug: req.body.slug,
      briefIntro: req.body.briefIntro,
      detail: req.body.detail,
    };

    if (req.files?.featuredImage?.[0]) {
      if (caseStudy.featuredImage) {
        await deleteFromCloudinary(caseStudy.featuredImage);
      }

      updateData.featuredImage = await uploadToCloudinary(
        req.files.featuredImage[0].path,
        "case-study/featured"
      );
    }

    await CaseStudy.findByIdAndUpdate(req.params.id, updateData);

    return res.status(200).json({
      success: true,
      message: "Case Study updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case Study not found",
      });
    }

    if (caseStudy.featuredImage) {
      await deleteFromCloudinary(caseStudy.featuredImage);
    }

    await CaseStudy.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Case Study deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changeFeatured = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case Study not found",
      });
    }

    caseStudy.featured = caseStudy.featured === 1 ? 0 : 1;

    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message:
        caseStudy.featured === 1
          ? "Case Study marked as Featured"
          : "Case Study removed from Featured",
      data: caseStudy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changeCaseStudyStatus = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: "Case Study not found",
      });
    }

    caseStudy.status = caseStudy.status === 1 ? 0 : 1;

    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message:
        caseStudy.status === 1
          ? "Case Study Activated Successfully"
          : "Case Study Deactivated Successfully",
      data: caseStudy,
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
    const seo = await CaseStudy.findById(req.params.id);

    return res.status(200).json({
      success: true,
      data: seo,
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
      featuredImageAlt,
      schemaCode,
    } = req.body;

    await CaseStudy.findByIdAndUpdate(req.params.id, {
      metaTitle,
      metaKeywords,
      metaDescription,
      featuredImageAlt,
      schemaCode,
    });

    return res.status(200).json({
      success: true,
      message: "SEO Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  addCaseStudy,
  getCaseStudies,
  getCaseStudyById,
  updateCaseStudy,
  deleteCaseStudy,
  changeFeatured,
  changeCaseStudyStatus,
  getSeoById,
  updateSeo,
};