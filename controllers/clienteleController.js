const Clientele = require("../models/Clientele");
const { uploadToCloudinary } = require("../utils/upload");
const deleteFromCloudinary = require("../utils/cloudinaryDelete");

const addClientele = async (req, res) => {
  try {
    const { clientName } = req.body;

    if (!clientName) {
      return res.status(400).json({
        success: false,
        message: "Client Name is required.",
      });
    }

    if (!req.files?.clientLogo?.length) {
      return res.status(400).json({
        success: false,
        message: "Client Logo is required.",
      });
    }

    const clientLogo = await uploadToCloudinary(
      req.files.clientLogo[0].path,
      "clientele"
    );

    const client = await Clientele.create({
      clientName,
      clientLogo,
    });

    res.status(201).json({
      success: true,
      message: "Client added successfully.",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const listClientele = async (req, res) => {
  const data = await Clientele.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    data,
  });
};
const clienteleDetail = async (req, res) => {
  const data = await Clientele.findById(req.params.id);

  res.json({
    success: true,
    data,
  });
};
const updateClientele = async (req, res) => {
  try {
    const { clientName } = req.body;

    const client = await Clientele.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    client.clientName = clientName;

    if (req.file) {
      const logo = await uploadToCloudinary(
        req.file.path,
        "clientele"
      );

      if (client.clientLogo) {
        await deleteFromCloudinary(client.clientLogo);
      }

      client.clientLogo = logo;
    }

    await client.save();

    res.json({
      success: true,
      message: "Client updated successfully.",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteClientele = async (req, res) => {
  try {
    const client = await Clientele.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (client.clientLogo) {
      await deleteFromCloudinary(client.clientLogo);
    }

    await Clientele.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Client deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changeStatus = async (req, res) => {
  const client = await Clientele.findById(req.params.id);

  client.status = client.status === 1 ? 0 : 1;

  await client.save();

  res.json({
    success: true,
    message: "Status updated successfully.",
  });
};

module.exports = {
  addClientele,
  listClientele,
  clienteleDetail,
  updateClientele,
  deleteClientele,
  changeStatus,
};