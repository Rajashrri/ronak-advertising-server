const express = require("express");

const router = express.Router();
const uploadResume = require("../middlewares/uploadResume");

const {
  getBlogs,
  getBlogDetails,
  getBlogCategories,
  addContact,
  addCareer,
  getFeaturedBlogs,
  getTestimonials,
  getClients,
  getFeaturedMedia,
    getMediaCoverage,
     getArticles,
       getLocations,
        getCaseStudies,
  getCaseStudyDetail,
  getCaseStudyTestimonials
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
router.get("/featured-blogs", getFeaturedBlogs);
router.get("/testimonials", getTestimonials);
router.get("/clients", getClients);
router.get("/featured-media", getFeaturedMedia);
router.get("/media-coverage", getMediaCoverage);
router.get("/articles", getArticles);
router.get("/locations", getLocations);
router.get("/case-studies", getCaseStudies);
router.get("/case-study/:slug", getCaseStudyDetail);
router.get(
  "/case-study/:slug/testimonials",
  getCaseStudyTestimonials
);
module.exports = router;
