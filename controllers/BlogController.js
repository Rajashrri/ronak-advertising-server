const Blog = require("../models/Blog");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");
const addBlog = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      slug,
      author,
      date,
      shortDescription,
      description,
    } = req.body;

    let mainImage = "";
    let featuredImage = "";

    if (req.files?.mainImage?.[0]) {
      mainImage = await uploadToCloudinary(
        req.files.mainImage[0].path,
        "blog/main"
      );
    }

    if (req.files?.featuredImage?.[0]) {
      featuredImage = await uploadToCloudinary(
        req.files.featuredImage[0].path,
        "blog/featured"
      );
    }

    const blog = new Blog({
      categoryId,
      title,
      slug,
      author,
      date,
      shortDescription,
      description,
      mainImage,
      featuredImage,
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: "Blog added successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (blog.mainImage) {
      await deleteFromCloudinary(blog.mainImage);
    }

    if (blog.featuredImage) {
      await deleteFromCloudinary(blog.featuredImage);
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("categoryId", "categoryName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("categoryId");

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const path = require("path");
const fs = require("fs");

const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const updateData = {
      categoryId: req.body.categoryId,
      title: req.body.title,
      slug: req.body.slug,
      author: req.body.author,
      date: req.body.date,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
    };

    // Main Image
    if (req.files?.mainImage?.[0]) {
      if (blog.mainImage) {
        await deleteFromCloudinary(blog.mainImage);
      }

      updateData.mainImage = await uploadToCloudinary(
        req.files.mainImage[0].path,
        "blog/main"
      );
    }

    // Featured Image
    if (req.files?.featuredImage?.[0]) {
      if (blog.featuredImage) {
        await deleteFromCloudinary(blog.featuredImage);
      }

      updateData.featuredImage = await uploadToCloudinary(
        req.files.featuredImage[0].path,
        "blog/featured"
      );
    }

    await Blog.findByIdAndUpdate(req.params.id, updateData);

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getSeoById = async (req, res) => {
  try {
    const seo = await Blog.findById(req.params.id);

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
      mainImageAlt,
      featuredImageAlt,
      schemaCode,
    } = req.body;

    await Blog.findByIdAndUpdate(req.params.id, {
      metaTitle,
      metaKeywords,
      metaDescription,
      mainImageAlt,
      featuredImageAlt,
      schemaCode,
    });

    return res.status(200).json({
      success: true,
      message: "SEO Updated Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
module.exports = {
  addBlog,
  getBlogs,
  deleteBlog,
  getBlogById,
  updateBlog,
  getSeoById,
  updateSeo,
};
