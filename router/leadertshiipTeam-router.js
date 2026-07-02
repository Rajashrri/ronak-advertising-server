const express = require("express");

const router = express.Router();

const leadershipTeamUpload = require("../middlewares/leadershipTeamUpload");

const {
  addLeadershipTeam,
  listLeadershipTeam,
  leadershipTeamDetail,
  updateLeadershipTeam,
  deleteLeadershipTeam,
  changeStatus,
} = require("../controllers/leadershipTeamController");


// ================= ADD =================

router.post(
  "/add",
  leadershipTeamUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addLeadershipTeam
);


// ================= LIST =================

router.get("/list", listLeadershipTeam);


// ================= DETAIL =================

router.get("/detail/:id", leadershipTeamDetail);


// ================= UPDATE =================

router.put(
  "/update/:id",
  leadershipTeamUpload.single("image"),
  updateLeadershipTeam
);


// ================= DELETE =================

router.delete(
  "/delete/:id",
  deleteLeadershipTeam
);


// ================= STATUS =================

router.patch(
  "/status/:id",
  changeStatus
);

module.exports = router;