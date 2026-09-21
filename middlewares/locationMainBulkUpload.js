const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(
  __dirname,
  "../uploads/location-main-bulk"
);

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
  if (ext === ".xlsx" || ext === ".xls") {
    if (file.fieldname === "excel") {
      return cb(null, true);
    }

    return cb(
      new Error("Excel file must be uploaded in the excel field"),
      false
    );
  }

  // ZIP - Main Images / Gallery Images
  if (ext === ".zip") {
    if (
      file.fieldname === "mainZip" ||
      file.fieldname === "galleryZip"
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "ZIP file must be uploaded in mainZip or galleryZip field"
      ),
      false
    );
  }

  return cb(
    new Error(
      "Only Excel (.xlsx/.xls) and ZIP (.zip) files are allowed"
    ),
    false
  );
};

const locationMainBulkUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = locationMainBulkUpload;