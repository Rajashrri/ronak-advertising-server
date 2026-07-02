const express = require("express");

const router = express.Router();
const uploadResume = require("../middlewares/uploadResume");

const {
  getBlogs,
  getBlogDetails,
  getBlogCategories,
  addContact,
  addCareer
} = require("../controllers/front-controller");

const resumeUpload = require("../utils/resumeUpload");

router.post(
  "/career",
  resumeUpload.single("resume"),
  addCareer
);
router.get("/blogs", getBlogs);
router.get("/blog/:slug", getBlogDetails);
router.get("/blog-categories", getBlogCategories);
router.post("/add-contact", addContact);

module.exports = router;
