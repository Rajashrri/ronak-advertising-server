const BlogCategory = require("../models/BlogCategory");

// Add Category
const addCategory = async (req, res) => {
  try {
    const { categoryName, slug } = req.body;

    if (!categoryName || !slug) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const categoryExists = await BlogCategory.findOne({ slug });

    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const category = new BlogCategory({
      categoryName,
      slug,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: category,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// List
const getCategories = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.max(Number(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // Search condition
    const searchQuery = search
      ? {
          $or: [
            {
              categoryName: {
                $regex: search,
                $options: "i",
              },
            },
            {
              slug: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    // Total records
    const total = await BlogCategory.countDocuments(searchQuery);

    // Paginated records
    const categories = await BlogCategory.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    });
  } catch (error) {
    console.log("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};;

// Single Category
const getCategoryById = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update
const updateCategory = async (req, res) => {
  try {
    const { categoryName, slug } = req.body;

    const category = await BlogCategory.findByIdAndUpdate(
      req.params.id,
      {
        categoryName,
        slug,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const deleteCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await BlogCategory.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const changeCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await BlogCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.status = category.status === 1 ? 0 : 1;

    await category.save();

    return res.status(200).json({
      success: true,
      message:
        category.status === 1
          ? "Category Activated Successfully"
          : "Category Deactivated Successfully",
      data: category,
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
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  changeCategoryStatus
};