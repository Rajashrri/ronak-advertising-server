const express = require("express");

const router = express.Router();

const {

  getContacts,getCareers,
 getNewsletter
} = require("../controllers/list-controller");

router.get("/contacts", getContacts);
router.get("/careers", getCareers);
router.get("/newsletter", getNewsletter);

module.exports = router;
