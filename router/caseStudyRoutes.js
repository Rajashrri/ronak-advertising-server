const express = require("express");
const router = express.Router();

const blogUpload = require("../middlewares/casestudy");

const {
  addCaseStudy,
  getCaseStudies,
  deleteCaseStudy,
  updateCaseStudy,
  getCaseStudyById,
  getSeoById,
  updateSeo,
  changeFeatured,
  changeCaseStudyStatus,
} = require("../controllers/CaseStudyController");

// Featured Toggle
router.patch("/change-featured/:id", changeFeatured);

// Add Case Study
router.post(
  "/add-case-study",
  blogUpload.fields([
    {
      name: "featuredImage",
      maxCount: 1,
    },
  ]),
  addCaseStudy
);

// Update Case Study
router.put(
  "/update-case-study/:id",
  blogUpload.fields([
    {
      name: "featuredImage",
      maxCount: 1,
    },
  ]),
  updateCaseStudy
);

// List
router.get("/list-case-study", getCaseStudies);

// Detail
router.get("/case-study-detail/:id", getCaseStudyById);

// Delete
router.delete("/delete-case-study/:id", deleteCaseStudy);

// Status
router.patch("/change-status/:id", changeCaseStudyStatus);

// SEO
router.get("/case-study-seo/:id", getSeoById);

router.put("/case-study-updateseo/:id", updateSeo);

module.exports = router;