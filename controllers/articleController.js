const Article = require("../models/Article");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

// ================= ADD =================
const addArticle = async (req, res) => {
  try {
    const {
      name,
      publishedDate,
      sourceName,
      briefIntro,
      articleLink,
    } = req.body;

    if (
      !name ||
      !publishedDate ||
      !sourceName ||
      !briefIntro ||
      !articleLink
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
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
      "articles"
    );

    const article = await Article.create({
      name,
      publishedDate,
      sourceName,
      briefIntro,
      articleLink,
      image,
      status: 1,
    });

    res.status(201).json({
      success: true,
      message: "Article added successfully",
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LIST =================
const listArticles = async (req, res) => {
  try {
    const data = await Article.find().sort({
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
const articleDetail = async (req, res) => {
  try {
    const data = await Article.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
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
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const {
      name,
      publishedDate,
      sourceName,
      briefIntro,
      articleLink,
    } = req.body;

    article.name = name;
    article.publishedDate = publishedDate;
    article.sourceName = sourceName;
    article.briefIntro = briefIntro;
    article.articleLink = articleLink;

    if (req.files?.image?.length) {
      if (article.image) {
        await deleteFromCloudinary(article.image);
      }

      article.image = await uploadToCloudinary(
        req.files.image[0].path,
        "articles"
      );
    }

    await article.save();

    res.json({
      success: true,
      message: "Article updated successfully",
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= DELETE =================
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    if (article.image) {
      await deleteFromCloudinary(article.image);
    }

    await Article.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Article deleted successfully",
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
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.status = article.status === 1 ? 0 : 1;

    await article.save();

    res.json({
      success: true,
      message: "Status updated",
      data: article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addArticle,
  listArticles,
  articleDetail,
  updateArticle,
  deleteArticle,
  changeStatus,
};