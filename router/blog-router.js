const express = require("express");
const router = express.Router();
const blogUpload = require("../middlewares/blogUpload");

const upload = require("../middlewares/upload");
const { addBlog,getBlogs,deleteBlog,updateBlog, getBlogById,  getSeoById,
  updateSeo,} = require("../controllers/BlogController");


router.post(
  "/add-blog",
  blogUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  addBlog
);

router.put(
  "/update-blog/:id",
  blogUpload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "featuredImage", maxCount: 1 },
  ]),
  updateBlog
);
router.get("/list-blog", getBlogs);
router.delete("/delete-blog/:id", deleteBlog);

router.get(
  "/blog-detail/:id",
  getBlogById
);



router.get("/blog-seo/:id", getSeoById);

router.put("/blog-updateseo/:id", updateSeo);
module.exports = router;