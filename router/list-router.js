const express = require("express");

const router = express.Router();

const {
  getContacts,
  getCareers,
  getNewsletter,
  getLocationEnquiries,
  getPopupEnquiries,
} = require("../controllers/list-controller");
router.get("/popup-enquiries", getPopupEnquiries);

router.get("/contacts", getContacts);
router.get("/careers", getCareers);
router.get("/newsletter", getNewsletter);
router.get("/location-enquiries", getLocationEnquiries);
module.exports = router;
