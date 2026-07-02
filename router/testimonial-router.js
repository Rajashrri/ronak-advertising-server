const express = require("express");
const router = express.Router();

const testimonialUpload = require("../middlewares/testimonialUpload");

const {
  addTestimonial,
  listTestimonials,
  testimonialDetail,
  updateTestimonial,
  deleteTestimonial,
  changeStatus
} = require("../controllers/testimonialController");

router.post(
  "/add-testimonial",
  testimonialUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addTestimonial
);

router.get("/list-testimonial", listTestimonials);
router.patch("/change-status/:id", changeStatus);
router.get("/testimonial-detail/:id", testimonialDetail);

router.put(
  "/update-testimonial/:id",
  testimonialUpload.single("image"),
  updateTestimonial
);

router.delete("/delete-testimonial/:id", deleteTestimonial);

module.exports = router;