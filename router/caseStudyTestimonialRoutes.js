const express = require("express");
const router = express.Router();

const caseStudyTestimonialUpload = require("../middlewares/caseStudyTestimonialUpload");

const {
  addCaseStudyTestimonial,
  getCaseStudyTestimonials,
  getCaseStudyTestimonialById,
  updateCaseStudyTestimonial,
  deleteCaseStudyTestimonial,
  changeCaseStudyTestimonialStatus,
  getSeoById,
  updateSeo,
} = require("../controllers/CaseStudyTestimonialController");

router.post(
  "/add-case-study-testimonial",
  caseStudyTestimonialUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addCaseStudyTestimonial
);

router.put(
  "/update-case-study-testimonial/:id",
  caseStudyTestimonialUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updateCaseStudyTestimonial
);

router.get(
  "/list-case-study-testimonial/:caseStudyId",
  getCaseStudyTestimonials
);

router.get(
  "/case-study-testimonial-detail/:id",
  getCaseStudyTestimonialById
);

router.delete(
  "/delete-case-study-testimonial/:id",
  deleteCaseStudyTestimonial
);

router.patch(
  "/change-status/:id",
  changeCaseStudyTestimonialStatus
);

router.get(
  "/seo/:id",
  getSeoById
);

router.put(
  "/update-seo/:id",
  updateSeo
);

module.exports = router;