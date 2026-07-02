const express = require("express");

const router = express.Router();

const {

  getContacts,getCareers
 
} = require("../controllers/list-controller");

router.get("/contacts", getContacts);
router.get("/careers", getCareers);
module.exports = router;
