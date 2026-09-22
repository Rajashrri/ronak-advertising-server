// ===============================
// utils/upload.js
// LOCAL + CLOUDINARY SUPPORT
// ===============================

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("./cloudinary");

const PROJECT_ROOT = path.resolve(__dirname, "..");

// ===============================
// MULTER STORAGE
// ===============================

const createStorage = (folderName) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(
        PROJECT_ROOT,
        "temp",
        folderName
      );

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
          recursive: true,
        });
      }

      cb(null, dir);
    },

    filename: function (req, file, cb) {
      cb(
        null,
        `${Date.now()}-${file.originalname}`
      );
    },
  });
};

// ===============================
// MULTER UPLOAD
// ===============================

const createUpload = (
  folderName,
  options = {}
) => {
  return multer({
    storage: createStorage(folderName),

    limits: {
      fileSize:
        options.maxSize ||
        5 * 1024 * 1024,
    },

    fileFilter:
      options.fileFilter ||
      function (req, file, cb) {
        const allowed =
          /jpeg|jpg|png|gif|webp/;

        const valid =
          allowed.test(
            path
              .extname(
                file.originalname
              )
              .toLowerCase()
          ) &&
          allowed.test(
            file.mimetype
          );

        cb(
          valid
            ? null
            : new Error(
                "Only images allowed"
              ),
          valid
        );
      },
  });
};

// ===============================
// UPLOAD INSTANCES
// ===============================

const professionUpload =
  createUpload("professions");

const celebrityUpload =
  createUpload("celebrity");

// ===============================
// CLOUDINARY UPLOAD FUNCTION
// ===============================
//
// resourceType:
//   image -> normal images
//   raw   -> Excel / ZIP / PDF / other files
//   auto  -> Cloudinary decides
//
// Existing calls remain compatible:
// uploadToCloudinary(filePath, folder)
//
// For Excel:
// uploadToCloudinary(filePath, folder, "raw")
//
// ===============================
// ===============================
// CLOUDINARY UPLOAD FUNCTION
// ===============================
//
// resourceType:
//   image -> normal images
//   raw   -> Excel / PDF / other files
//   auto  -> Cloudinary decides
//
// deleteLocal:
//   true  -> upload ke baad local file delete
//   false -> upload ke baad local file delete nahi
//
// Existing image calls remain compatible:
// uploadToCloudinary(filePath, folder)
//
// Excel:
// uploadToCloudinary(filePath, folder, "raw", false)
// ===============================

const uploadToCloudinary = async (
  filePath,
  folder,
  resourceType = "image",
  deleteLocal = true
) => {
  try {
    console.log("☁️ Cloudinary Upload Started");
    console.log("File:", filePath);
    console.log("Folder:", folder);
    console.log("Resource Type:", resourceType);
    console.log("Delete Local:", deleteLocal);

    // Check local file
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `File not found: ${filePath}`
      );
    }

    // Upload to Cloudinary
    const result =
      await cloudinary.uploader.upload(
        filePath,
        {
          folder,
          resource_type: resourceType,
        }
      );

    console.log(
      "✅ Cloudinary Upload Successful"
    );

    console.log(
      "Cloudinary URL:",
      result.secure_url
    );

    // Delete local file only when requested
    if (
      deleteLocal &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);

      console.log(
        "🗑️ Local temp file deleted"
      );
    }

    return result.secure_url;

  } catch (error) {
    console.error(
      "❌ Cloudinary Upload Failed"
    );

    console.error(
      "File:",
      filePath
    );

    console.error(
      "Folder:",
      folder
    );

    console.error(
      "Resource Type:",
      resourceType
    );

    console.error(
      "Error:",
      error
    );

    // Delete local file only when requested
    if (
      deleteLocal &&
      filePath &&
      fs.existsSync(filePath)
    ) {
      try {
        fs.unlinkSync(filePath);

        console.log(
          "🗑️ Failed upload temp file deleted"
        );
      } catch (deleteError) {
        console.error(
          "❌ Could not delete temp file:",
          deleteError
        );
      }
    }

    throw error;
  }
};

// ===============================
// CELEBRITY FILE PROCESSOR
// ===============================

const processCelebrityFiles = async (
  files,
  celebId
) => {
  const result = {
    imagePath: null,
    categoryImagePath: null,
    featuredImagePath: null,
    galleryPaths: [],
  };

  if (!files) {
    return result;
  }

  // ===============================
  // PROFILE IMAGE
  // ===============================

  if (files.image?.[0]) {
    result.imagePath =
      await uploadToCloudinary(
        files.image[0].path,
        "celebrity/profile"
      );
  }

  // ===============================
  // CATEGORY IMAGE
  // ===============================

  if (files.categoryimage?.[0]) {
    result.categoryImagePath =
      await uploadToCloudinary(
        files.categoryimage[0].path,
        "celebrity/category"
      );
  }

  // ===============================
  // FEATURED IMAGE
  // ===============================

  if (files.featuredimage?.[0]) {
    result.featuredImagePath =
      await uploadToCloudinary(
        files.featuredimage[0].path,
        "celebrity/featured"
      );
  }

  // ===============================
  // GALLERY
  // ===============================

  if (files.gallery?.length) {
    for (const file of files.gallery) {
      const url =
        await uploadToCloudinary(
          file.path,
          "celebrity/gallery"
        );

      result.galleryPaths.push(url);
    }
  }

  return result;
};

// ===============================
// EXPORTS
// ===============================

module.exports = {
  createUpload,
  processCelebrityFiles,
  professionUpload,
  celebrityUpload,
  uploadToCloudinary,
};