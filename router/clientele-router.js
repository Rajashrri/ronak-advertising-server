const express = require("express");
const router = express.Router();

const clienteleUpload = require("../middlewares/clienteleUpload");

const {
  addClientele,
  listClientele,
  clienteleDetail,
  updateClientele,
  deleteClientele,
  changeStatus,
} = require("../controllers/  ");

router.post(
  "/add-client",
  clienteleUpload.fields([
    {
      name: "clientLogo",
      maxCount: 1,
    },
  ]),
  addClientele
);

router.get("/list-client", listClientele);

router.get("/client-detail/:id", clienteleDetail);

router.put(
  "/update-client/:id",
  clienteleUpload.single("clientLogo"),
  updateClientele
);

router.delete("/delete-client/:id", deleteClientele);

router.patch("/change-status/:id", changeStatus);

module.exports = router;