const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(
  __dirname,
  "../uploads/location-bulk"
);

// Folder create
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    const name =
      path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_") +
      "-" +
      Date.now() +
      ext;

    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path
    .extname(file.originalname)
    .toLowerCase();

  // Excel
  if (
    file.fieldname === "excel" &&
    [".xlsx", ".xls"].includes(ext)
  ) {
    return cb(null, true);
  }

  // ZIP
  if (
    file.fieldname === "zip" &&
    ext === ".zip"
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only Excel (.xlsx/.xls) and ZIP (.zip) files are allowed"
    ),
    false
  );
};

const locationBulkUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

module.exports = locationBulkUpload;