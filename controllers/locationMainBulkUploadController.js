const XLSX = require("xlsx");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const Location = require("../models/Location");
const LocationMain = require("../models/LocationMain");
const LocationMainBulkUpload = require("../models/LocationMainBulkUpload");

const { uploadToCloudinary } = require("../utils/upload");

// ==========================================
// SLUGIFY
// ==========================================

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// ==========================================
// ALLOWED MEDIA TYPES
// EXACT SAME AS ADD LOCATION MAIN
// ==========================================

const ALLOWED_MEDIA_TYPES = [
  "Gantry",
  "Flag",
  "Hoarding",
  "Cantilever",
  "BQS (Bus Shelter)",
  "Kiosk",
];

// ==========================================
// NORMALIZE FILE NAME
// ==========================================

const normalizeFileName = (name) => {
  if (!name) return "";

  let fileName = path
    .basename(String(name).trim().replace(/\\/g, "/"))
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, "")
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  // Remove duplicate extensions
  const imageExtensions = [".webp", ".jpg", ".jpeg", ".png", ".gif"];

  for (const ext of imageExtensions) {
    if (fileName.endsWith(ext + ext)) {
      fileName = fileName.slice(0, -ext.length);
      break;
    }
  }

  return fileName;
};

// ==========================================
// FIND IMAGE RECURSIVELY
// ==========================================

const findImageInFolder = (folder, imageName) => {
  const targetName = normalizeFileName(imageName);

  if (!targetName) {
    return null;
  }

  const scan = (currentFolder) => {
    const files = fs.readdirSync(currentFolder, {
      withFileTypes: true,
    });

    for (const file of files) {
      const fullPath = path.join(currentFolder, file.name);

      if (file.isDirectory()) {
        const found = scan(fullPath);

        if (found) {
          return found;
        }

        continue;
      }

      const normalizedFileName = normalizeFileName(file.name);

      console.log(
        "CHECK IMAGE:",
        file.name,
        "=>",
        normalizedFileName,
        "TARGET:",
        targetName,
      );

      if (normalizedFileName === targetName) {
        console.log("IMAGE FOUND:", fullPath);

        return fullPath;
      }
    }

    return null;
  };

  return scan(folder);
};

// ==========================================
// BULK UPLOAD LOCATION MAIN
// ==========================================

const bulkUploadLocationMain = async (req, res) => {
  let history = null;
  let mainExtractFolder = null;
  let galleryExtractFolder = null;

  let mainZipFile = null;
  let galleryZipFile = null;

  try {
    // ======================================
    // CHECK EXCEL
    // ======================================

    if (!req.files || !req.files.excel || !req.files.excel.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file required",
      });
    }

    // ======================================
    // CHECK ZIP
    // ======================================

    if (!req.files.mainZip?.length) {
      return res.status(400).json({
        success: false,
        message: "Main Images ZIP required",
      });
    }

    const excelFile = req.files.excel[0];

    mainZipFile = req.files.mainZip[0];

    galleryZipFile = req.files?.galleryZip?.[0] || null;
    // ======================================
    // CREATE HISTORY
    // ======================================

 

    // ======================================
    // READ EXCEL
    // ======================================
// ======================================
// READ EXCEL
// ======================================

const workbook = XLSX.readFile(excelFile.path, {
  cellDates: true,
});

if (!workbook.SheetNames.length) {
  return res.status(400).json({
    success: false,
    message: "Excel is empty",
  });
}

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

console.log("======================================");
console.log("EXCEL FILE:", excelFile.originalname);
console.log("SHEET NAME:", sheetName);
console.log("SHEET REF:", sheet["!ref"]);
console.log("======================================");

// ======================================
// READ RAW ROWS
// ======================================

const rawRows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: "",
  blankrows: false,
});

console.log("RAW EXCEL ROWS:", rawRows);

// ======================================
// COMPLETELY EMPTY EXCEL
// ======================================

if (!rawRows || rawRows.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Excel is empty",
  });
}

// ======================================
// CHECK HEADER ROW
// ======================================

const headers = Array.isArray(rawRows[0])
  ? rawRows[0].map((header) => String(header || "").trim())
  : [];

console.log("EXCEL HEADERS:", headers);

// Header row completely blank
if (!headers.length || headers.every((header) => !header)) {
  return res.status(400).json({
    success: false,
    message: "Excel is empty",
  });
}

// ======================================
// READ DATA ROWS
// ======================================

const rows = XLSX.utils.sheet_to_json(sheet, {
  defval: "",
  blankrows: false,
});

console.log("PARSED ROWS:", rows);
console.log("PARSED ROW COUNT:", rows.length);

// ======================================
// HEADER EXISTS BUT NO DATA
// ======================================

if (!rows || rows.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Excel contains headers but no data rows",
  });
}
// ======================================
// CREATE HISTORY
// ONLY AFTER EXCEL VALIDATION
// ======================================

history = await LocationMainBulkUpload.create({
  fileName: excelFile.originalname,
  excelFile: excelFile.originalname,
  mainZipFile: mainZipFile.originalname,
  galleryZipFile: galleryZipFile
    ? galleryZipFile.originalname
    : "",
  status: "Processing",
  totalRecords: rows.length,
  successRecords: 0,
  failedRecords: 0,
  errorLog: [],
});
    // ======================================
    // EXTRACT ZIP
    // ======================================

    // Gallery ZIP Optional

    // ======================================
    // EXTRACT ZIP
    // ======================================

    mainExtractFolder = path.join(
      __dirname,
      "../uploads/location-main-temp-main-" + history._id,
    );

    fs.mkdirSync(mainExtractFolder, {
      recursive: true,
    });

    const mainZip = new AdmZip(mainZipFile.path);

    mainZip.extractAllTo(mainExtractFolder, true);

    // Gallery ZIP Optional

    if (galleryZipFile) {
      galleryExtractFolder = path.join(
        __dirname,
        "../uploads/location-main-temp-gallery-" + history._id,
      );

      fs.mkdirSync(galleryExtractFolder, {
        recursive: true,
      });

      const galleryZip = new AdmZip(galleryZipFile.path);

      galleryZip.extractAllTo(galleryExtractFolder, true);
    }
    // ======================================
    // COUNTERS
    // ======================================

    let successCount = 0;
    let failedCount = 0;

    const errorLog = [];

    // ======================================
    // PROCESS EACH ROW
    // ======================================

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      let locationName = "";

      try {
        // ==================================
        // EXCEL VALUES
        // ==================================

        locationName = row["Location Name"]?.toString().trim();

        const siteName = row["Site Name"]?.toString().trim();

        const excelSlug = row["Slug"]?.toString().trim();

        const mediaType = row["Media Type"]?.toString().trim();

const imageName = row["Featured Image"]?.toString().trim();
        const ytVideoLink = row["YT Video Link"]?.toString().trim();

        const galleryValue = row["Media Gallery Images"]?.toString().trim();

const detail = row["Summary"]?.toString().trim();
        const media = row["Media"]?.toString().trim();

        const type = row["Type"]?.toString().trim();

        const siteCode = row["Site Code"]?.toString().trim();

        const latitude = row["Latitude"]?.toString().trim();

        const longitude = row["Longitude"]?.toString().trim();

        const metaTitle = row["Meta Title"]?.toString().trim();

        const metaKeywords = row["Meta Keywords"]?.toString().trim();

        const metaDescription = row["Meta Description"]?.toString().trim();

        const mainImageAlt = row["Main Image Alt"]?.toString().trim();

        const featuredImageAlt = row["Featured Image Alt"]?.toString().trim();

        const schemaCode = row["Schema Code"]?.toString().trim();

        // ==================================
        // REQUIRED VALIDATION
        // ==================================

        if (!locationName) {
          throw new Error("Location Name is required");
        }

        if (!siteName) {
          throw new Error("Site Name is required");
        }

        if (!mediaType) {
          throw new Error("Media Type is required");
        }

        if (!imageName) {
          throw new Error("Image is required");
        }

        // ==================================
        // LOCATION MASTER EXACT MATCH
        // ==================================

        const location = await Location.findOne({
          locationName: locationName,
        });

        if (!location) {
          throw new Error(
            `Location "${locationName}" not found in Location Master`,
          );
        }

        // ==================================
        // MEDIA TYPE EXACT MATCH
        // ==================================

        if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
          throw new Error(
            `Invalid Media Type "${mediaType}". Allowed values: ${ALLOWED_MEDIA_TYPES.join(
              ", ",
            )}`,
          );
        }

        // ==================================
        // MAIN IMAGE EXTENSION
        // ONLY WEBP
        // ==================================

        const mainImageExt = path.extname(imageName).toLowerCase();

        if (mainImageExt !== ".webp") {
          throw new Error(`Image "${imageName}" must be .webp`);
        }

        // ==================================
        // FIND MAIN IMAGE
        // ==================================

        const imagePath = findImageInFolder(mainExtractFolder, imageName);
        if (!imagePath) {
          throw new Error(`Image "${imageName}" not found in ZIP`);
        }

        // ==================================
        // GALLERY NAMES
        // ==================================

        let galleryNames = [];

        if (galleryValue) {
          galleryNames = galleryValue
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }

        // ==================================
        // MAX 10 GALLERY
        // ==================================

        if (galleryNames.length > 10) {
          throw new Error("Maximum 10 gallery images are allowed");
        }

        // ==================================
        // VALIDATE GALLERY
        // ==================================

        const galleryPaths = [];

        if (galleryNames.length && !galleryExtractFolder) {
          throw new Error(
            "Gallery images specified in Excel but Gallery ZIP not uploaded",
          );
        }

        for (const galleryName of galleryNames) {
          const galleryExt = path.extname(galleryName).toLowerCase();

          if (galleryExt !== ".webp") {
            throw new Error(`Gallery image "${galleryName}" must be .webp`);
          }

          const galleryPath = findImageInFolder(
            galleryExtractFolder,
            galleryName,
          );
          if (!galleryPath) {
            throw new Error(`Gallery image "${galleryName}" not found in ZIP`);
          }

          galleryPaths.push(galleryPath);
        }

        // ==================================
        // GENERATE SLUG
        // ==================================

        const finalSlug = excelSlug ? slugify(excelSlug) : slugify(siteName);

        if (!finalSlug) {
          throw new Error("Valid Slug could not be generated");
        }

        // ==================================
        // DUPLICATE SLUG
        // ==================================

        const existingSlug = await LocationMain.findOne({
          slug: finalSlug,
        });

        if (existingSlug) {
          throw new Error(`Slug "${finalSlug}" already exists`);
        }

        // ==================================
        // UPLOAD MAIN IMAGE
        // ==================================

        const imageUrl = await uploadToCloudinary(imagePath, "location-main");

        if (!imageUrl) {
          throw new Error("Cloudinary main image URL not returned");
        }

        // ==================================
        // UPLOAD GALLERY
        // ==================================

        const galleryImages = [];

        for (const galleryPath of galleryPaths) {
          const galleryUrl = await uploadToCloudinary(
            galleryPath,
            "location-main/gallery",
          );

          if (!galleryUrl) {
            throw new Error("Cloudinary gallery image URL not returned");
          }

          galleryImages.push(galleryUrl);
        }

        // ==================================
        // CREATE LOCATION MAIN
        // ==================================

        await LocationMain.create({
          locationId: location._id,

          siteName,

          slug: finalSlug,

          image: imageUrl,

          ytVideoLink: ytVideoLink || "",

          mediaGallery: galleryImages,

          detail: detail || "",

          media: media || "",

          type: type || "",

          mediaType,

          siteCode: siteCode || "",

          latitude: latitude || "",

          longitude: longitude || "",

          metaTitle: metaTitle || "",

          metaKeywords: metaKeywords || "",

          metaDescription: metaDescription || "",

          mainImageAlt: mainImageAlt || "",

          featuredImageAlt: featuredImageAlt || "",

          schemaCode: schemaCode || "",

          status: 1,
        });

        // ==================================
        // SUCCESS
        // ==================================

        successCount++;
      } catch (err) {
        failedCount++;

        errorLog.push({
          rowNo: i + 2,

          locationName,

          message: err.message || "Unknown error",
        });
      }
    }

    // ======================================
    // UPDATE HISTORY
    // ======================================

    history.totalRecords = rows.length;

    history.successRecords = successCount;

    history.failedRecords = failedCount;

    history.errorLog = errorLog;

    history.status = "Completed";

    await history.save();

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,

      message: "Location Main bulk upload completed",

      data: {
        totalRecords: rows.length,

        successRecords: successCount,

        failedRecords: failedCount,
      },
    });
  } catch (error) {
    console.error("Location Main Bulk Upload Error:", error);

    if (history) {
      history.status = "Failed";

      history.errorLog = [
        {
          rowNo: 0,
          message: error.message || "Bulk upload failed",
        },
      ];

      await history.save();
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Bulk upload failed",
    });
  } finally {
    // ======================================
    // DELETE EXTRACTED FOLDER
    // ======================================

    if (mainExtractFolder && fs.existsSync(mainExtractFolder)) {
      fs.rmSync(mainExtractFolder, {
        recursive: true,
        force: true,
      });
    }

    if (galleryExtractFolder && fs.existsSync(galleryExtractFolder)) {
      fs.rmSync(galleryExtractFolder, {
        recursive: true,
        force: true,
      });
    }

    // ======================================
    // DELETE EXCEL
    // ======================================

    if (req.files?.excel?.[0]?.path && fs.existsSync(req.files.excel[0].path)) {
      fs.unlinkSync(req.files.excel[0].path);
    }

    // ======================================
    // DELETE ZIP
    // ======================================

    if (
      req.files?.mainZip?.[0]?.path &&
      fs.existsSync(req.files.mainZip[0].path)
    ) {
      fs.unlinkSync(req.files.mainZip[0].path);
    }

    if (galleryZipFile?.path && fs.existsSync(galleryZipFile.path)) {
      fs.unlinkSync(galleryZipFile.path);
    }
  }
};

// ==========================================
// LIST
// ==========================================

const getLocationMainBulkUploadList = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 10;

    const search = req.query.search?.toString().trim() || "";

    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.fileName = {
        $regex: search,
        $options: "i",
      };
    }

    const [records, total] = await Promise.all([
      LocationMainBulkUpload.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      LocationMainBulkUpload.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,

      data: records,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Location Main Bulk Upload List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bulk upload list",
      error: error.message,
    });
  }
};

// ==========================================
// DETAIL
// ==========================================

const getLocationMainBulkUploadDetail = async (req, res) => {
  try {
    const record = await LocationMainBulkUpload.findById(req.params.id).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Bulk upload record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  bulkUploadLocationMain,
  getLocationMainBulkUploadList,
  getLocationMainBulkUploadDetail,
};
