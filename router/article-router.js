const express = require("express");
const router = express.Router();

const articleUpload = require("../middlewares/articleUpload");

const {
  addArticle,
  listArticles,
  articleDetail,
  updateArticle,
  deleteArticle,
  changeStatus,
} = require("../controllers/articleController");

// ================= ADD =================
router.post(
  "/add-article",
  articleUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addArticle
);

// ================= LIST =================
router.get("/list-articles", listArticles);

// ================= DETAIL =================
router.get("/article-detail/:id", articleDetail);

// ================= UPDATE =================
router.put(
  "/update-article/:id",
  articleUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateArticle
);

// ================= DELETE =================
router.delete("/delete-article/:id", deleteArticle);

// ================= STATUS TOGGLE =================
router.patch("/change-status/:id", changeStatus);

module.exports = router;