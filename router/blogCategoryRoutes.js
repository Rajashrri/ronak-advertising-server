const express = require("express");
const router = express.Router();

const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require("../controllers/blogCategoryController");

router.post("/add-category", addCategory);

router.get("/list", getCategories);

router.get("/:id", getCategoryById);

router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);
module.exports = router;