const express = require("express");
const router = express.Router();

const coreTeamUpload = require("../middlewares/coreTeamUpload");

const {
  addCoreTeam,
  listCoreTeam,
  coreTeamDetail,
  updateCoreTeam,
  deleteCoreTeam,
  changeStatus,
} = require("../controllers/coreTeamController");

// Add
router.post(
  "/add-core-team",
  coreTeamUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addCoreTeam
);

// List
router.get(
  "/list-core-team",
  listCoreTeam
);

// Detail
router.get(
  "/core-team-detail/:id",
  coreTeamDetail
);

// Update
router.put(
  "/update-core-team/:id",
  coreTeamUpload.single("image"),
  updateCoreTeam
);

// Delete
router.delete(
  "/delete-core-team/:id",
  deleteCoreTeam
);

// Status
router.patch(
  "/change-status/:id",
  changeStatus
);

module.exports = router;