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
  const imageExtensions = [
    ".webp",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ];

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

  if (!targetName || !folder || !fs.existsSync(folder)) {
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
        targetName
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
    console.log("======================================");
    console.log("LOCATION MAIN BULK UPLOAD STARTED");
    console.log("======================================");

    // ======================================
    // CHECK EXCEL
    // ======================================

    if (
      !req.files ||
      !req.files.excel ||
      !req.files.excel.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Excel file required",
      });
    }

    // ======================================
    // CHECK MAIN ZIP
    // ======================================

    if (
      !req.files.mainZip ||
      !req.files.mainZip.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Main Images ZIP required",
      });
    }

    // ======================================
    // FILE REFERENCES
    // ======================================

    const excelFile = req.files.excel[0];

    mainZipFile = req.files.mainZip[0];

    galleryZipFile =
      req.files.galleryZip &&
      req.files.galleryZip.length
        ? req.files.galleryZip[0]
        : null;

    console.log("Excel:", excelFile.originalname);
    console.log("Main ZIP:", mainZipFile.originalname);
    console.log(
      "Gallery ZIP:",
      galleryZipFile
        ? galleryZipFile.originalname
        : "Not uploaded"
    );

    // ======================================
    // VALIDATE EXCEL EXTENSION
    // ======================================

    const excelExtension = path
      .extname(excelFile.originalname)
      .toLowerCase();

    if (
      excelExtension !== ".xlsx" &&
      excelExtension !== ".xls"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only Excel files (.xlsx, .xls) are allowed",
      });
    }

    // ======================================
    // VALIDATE MAIN ZIP EXTENSION
    // ======================================

    const mainZipExtension = path
      .extname(mainZipFile.originalname)
      .toLowerCase();

    if (mainZipExtension !== ".zip") {
      return res.status(400).json({
        success: false,
        message: "Main Images file must be a ZIP",
      });
    }

    // ======================================
    // VALIDATE GALLERY ZIP EXTENSION
    // ======================================

    if (galleryZipFile) {
      const galleryZipExtension = path
        .extname(galleryZipFile.originalname)
        .toLowerCase();

      if (galleryZipExtension !== ".zip") {
        return res.status(400).json({
          success: false,
          message: "Gallery Images file must be a ZIP",
        });
      }
    }

    // ======================================
    // READ EXCEL
    // ======================================

    console.log("Reading Excel...");

    const workbook = XLSX.readFile(excelFile.path, {
      cellDates: true,
    });

    // ======================================
    // CHECK SHEETS
    // ======================================

    if (
      !workbook.SheetNames ||
      workbook.SheetNames.length === 0
    ) {
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
    // CHECK SHEET REF
    // ======================================

    if (!sheet || !sheet["!ref"]) {
      return res.status(400).json({
        success: false,
        message: "Excel is empty",
      });
    }

    // ======================================
    // READ RAW EXCEL
    // ======================================

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    console.log("RAW EXCEL ROW COUNT:", rawRows.length);

    // ======================================
    // REMOVE COMPLETELY EMPTY ROWS
    // ======================================

    const nonEmptyRows = rawRows.filter((row) => {
      if (!Array.isArray(row)) {
        return false;
      }

      return row.some((cell) => {
        return String(cell ?? "").trim() !== "";
      });
    });

    console.log(
      "NON EMPTY ROW COUNT:",
      nonEmptyRows.length
    );

    // ======================================
    // EXCEL COMPLETELY EMPTY
    // ======================================

    if (nonEmptyRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel is empty",
      });
    }

    // ======================================
    // HEADER ROW
    // ======================================

    const headers = nonEmptyRows[0].map((header) =>
      String(header ?? "").trim()
    );

    console.log("EXCEL HEADERS:", headers);

    // ======================================
    // HEADER COMPLETELY EMPTY
    // ======================================

    if (
      !headers.length ||
      headers.every((header) => header === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Excel header is empty",
      });
    }

    // ======================================
    // DATA ROWS
    // ======================================

    const dataRows = nonEmptyRows.slice(1);

    console.log(
      "DATA ROW COUNT:",
      dataRows.length
    );

    // ======================================
    // ONLY HEADER - NO DATA
    // ======================================

    if (dataRows.length === 0) {
      console.log(
        "NO DATA ROWS - HISTORY WILL NOT BE CREATED"
      );

      return res.status(400).json({
        success: false,
        message: "Excel contains headers but no data rows",
      });
    }

    // ======================================
    // CHECK ACTUAL DATA
    // ======================================

    const hasActualData = dataRows.some((row) => {
      if (!Array.isArray(row)) {
        return false;
      }

      return row.some((cell) => {
        return String(cell ?? "").trim() !== "";
      });
    });

    if (!hasActualData) {
      console.log(
        "NO ACTUAL DATA - HISTORY WILL NOT BE CREATED"
      );

      return res.status(400).json({
        success: false,
        message: "Excel contains headers but no data rows",
      });
    }

    // ======================================
    // CONVERT EXCEL TO OBJECT ROWS
    // ======================================

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      blankrows: false,
    });

    console.log(
      "OBJECT ROW COUNT:",
      rows.length
    );

    // ======================================
    // REMOVE COMPLETELY EMPTY OBJECT ROWS
    // ======================================

    const validRows = rows.filter((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }

      return Object.values(row).some((value) => {
        return String(value ?? "").trim() !== "";
      });
    });

    console.log(
      "VALID DATA ROW COUNT:",
      validRows.length
    );

    // ======================================
    // FINAL NO DATA CHECK
    // ======================================

    if (validRows.length === 0) {
      console.log(
        "VALID ROWS = 0 - HISTORY WILL NOT BE CREATED"
      );

      return res.status(400).json({
        success: false,
        message: "Excel contains headers but no data rows",
      });
    }

    // ======================================
    // CREATE UNIQUE TEMP ID
    // ======================================

    const tempId =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 8);

    // ======================================
    // MAIN ZIP EXTRACT FOLDER
    // ======================================

    mainExtractFolder = path.join(
      __dirname,
      "../uploads/location-main-temp-main-" + tempId
    );

    fs.mkdirSync(mainExtractFolder, {
      recursive: true,
    });

    // ======================================
    // EXTRACT MAIN ZIP
    // ======================================

    console.log("Extracting Main ZIP...");

    const mainZip = new AdmZip(mainZipFile.path);

    mainZip.extractAllTo(
      mainExtractFolder,
      true
    );

    console.log(
      "Main ZIP extracted:",
      mainExtractFolder
    );

    // ======================================
    // GALLERY ZIP OPTIONAL
    // ======================================

    if (galleryZipFile) {
      galleryExtractFolder = path.join(
        __dirname,
        "../uploads/location-main-temp-gallery-" +
          tempId
      );

      fs.mkdirSync(galleryExtractFolder, {
        recursive: true,
      });

      console.log("Extracting Gallery ZIP...");

      const galleryZip = new AdmZip(
        galleryZipFile.path
      );

      galleryZip.extractAllTo(
        galleryExtractFolder,
        true
      );

      console.log(
        "Gallery ZIP extracted:",
        galleryExtractFolder
      );
    }

    // ======================================
    // CREATE HISTORY
    // IMPORTANT:
    // ONLY AFTER EXCEL VALIDATION
    // ======================================

    console.log("======================================");
    console.log("CREATING BULK UPLOAD HISTORY");
    console.log("FILE:", excelFile.originalname);
    console.log("VALID ROWS:", validRows.length);
    console.log("======================================");

    history = await LocationMainBulkUpload.create({
      fileName: excelFile.originalname,
      excelFile: excelFile.originalname,
      mainZipFile: mainZipFile.originalname,
      galleryZipFile: galleryZipFile
        ? galleryZipFile.originalname
        : "",
      status: "Processing",
      totalRecords: validRows.length,
      successRecords: 0,
      failedRecords: 0,
      errorLog: [],
    });

    console.log(
      "HISTORY CREATED:",
      history._id
    );

    // ======================================
    // COUNTERS
    // ======================================

    let successCount = 0;
    let failedCount = 0;

    const errorLog = [];

    // ======================================
    // PROCESS EACH ROW
    // ======================================

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      let locationName = "";

      try {
        console.log(
          "======================================"
        );

        console.log(
          `PROCESSING ROW ${i + 2}`
        );

        // ==================================
        // EXCEL VALUES
        // ==================================

        locationName =
          row["Location Name"]?.toString().trim() ||
          "";

        const siteName =
          row["Site Name"]?.toString().trim() ||
          "";

        const excelSlug =
          row["Slug"]?.toString().trim() ||
          "";

        const mediaType =
          row["Media Type"]?.toString().trim() ||
          "";

        const imageName =
          row["Featured Image"]?.toString().trim() ||
          "";

        const ytVideoLink =
          row["YT Video Link"]?.toString().trim() ||
          "";

        const galleryValue =
          row["Media Gallery Images"]
            ?.toString()
            .trim() || "";

        const detail =
          row["Summary"]?.toString().trim() ||
          "";

        const media =
          row["Media"]?.toString().trim() ||
          "";

        const type =
          row["Type"]?.toString().trim() ||
          "";

        const siteCode =
          row["Site Code"]?.toString().trim() ||
          "";

        const latitude =
          row["Latitude"]?.toString().trim() ||
          "";

        const longitude =
          row["Longitude"]?.toString().trim() ||
          "";

        const metaTitle =
          row["Meta Title"]?.toString().trim() ||
          "";

        const metaKeywords =
          row["Meta Keywords"]?.toString().trim() ||
          "";

        const metaDescription =
          row["Meta Description"]?.toString().trim() ||
          "";

        const mainImageAlt =
          row["Main Image Alt"]?.toString().trim() ||
          "";

        const featuredImageAlt =
          row["Featured Image Alt"]
            ?.toString()
            .trim() || "";

        const schemaCode =
          row["Schema Code"]?.toString().trim() ||
          "";

        // ==================================
        // REQUIRED VALIDATION
        // ==================================

        if (!locationName) {
          throw new Error(
            "Location Name is required"
          );
        }

        if (!siteName) {
          throw new Error(
            "Site Name is required"
          );
        }

        if (!mediaType) {
          throw new Error(
            "Media Type is required"
          );
        }

        if (!imageName) {
          throw new Error(
            "Featured Image is required"
          );
        }

        // ==================================
        // LOCATION MASTER
        // ==================================

        const location =
          await Location.findOne({
            locationName: locationName,
          });

        if (!location) {
          throw new Error(
            `Location "${locationName}" not found in Location Master`
          );
        }

        // ==================================
        // MEDIA TYPE
        // ==================================

        if (
          !ALLOWED_MEDIA_TYPES.includes(
            mediaType
          )
        ) {
          throw new Error(
            `Invalid Media Type "${mediaType}". Allowed values: ${ALLOWED_MEDIA_TYPES.join(
              ", "
            )}`
          );
        }

        // ==================================
        // MAIN IMAGE EXTENSION
        // ONLY WEBP
        // ==================================

        const mainImageExt = path
          .extname(imageName)
          .toLowerCase();

        if (mainImageExt !== ".webp") {
          throw new Error(
            `Image "${imageName}" must be .webp`
          );
        }

        // ==================================
        // FIND MAIN IMAGE
        // ==================================

        const imagePath =
          findImageInFolder(
            mainExtractFolder,
            imageName
          );

        if (!imagePath) {
          throw new Error(
            `Image "${imageName}" not found in ZIP`
          );
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
          throw new Error(
            "Maximum 10 gallery images are allowed"
          );
        }

        // ==================================
        // GALLERY ZIP REQUIRED IF
        // GALLERY IMAGES ARE SPECIFIED
        // ==================================

        if (
          galleryNames.length &&
          !galleryExtractFolder
        ) {
          throw new Error(
            "Gallery images specified in Excel but Gallery ZIP not uploaded"
          );
        }

        // ==================================
        // VALIDATE GALLERY IMAGES
        // ==================================

        const galleryPaths = [];

        for (const galleryName of galleryNames) {
          const galleryExt = path
            .extname(galleryName)
            .toLowerCase();

          if (galleryExt !== ".webp") {
            throw new Error(
              `Gallery image "${galleryName}" must be .webp`
            );
          }

          const galleryPath =
            findImageInFolder(
              galleryExtractFolder,
              galleryName
            );

          if (!galleryPath) {
            throw new Error(
              `Gallery image "${galleryName}" not found in ZIP`
            );
          }

          galleryPaths.push(galleryPath);
        }

        // ==================================
        // GENERATE SLUG
        // ==================================

        const finalSlug = excelSlug
          ? slugify(excelSlug)
          : slugify(siteName);

        if (!finalSlug) {
          throw new Error(
            "Valid Slug could not be generated"
          );
        }

        // ==================================
        // DUPLICATE SLUG
        // ==================================

        const existingSlug =
          await LocationMain.findOne({
            slug: finalSlug,
          });

        if (existingSlug) {
          throw new Error(
            `Slug "${finalSlug}" already exists`
          );
        }

        // ==================================
        // UPLOAD MAIN IMAGE
        // ==================================

        console.log(
          "Uploading main image:",
          imageName
        );

        const imageUrl =
          await uploadToCloudinary(
            imagePath,
            "location-main"
          );

        if (!imageUrl) {
          throw new Error(
            "Cloudinary main image URL not returned"
          );
        }

        // ==================================
        // UPLOAD GALLERY
        // ==================================

        const galleryImages = [];

        for (
          const galleryPath of galleryPaths
        ) {
          const galleryUrl =
            await uploadToCloudinary(
              galleryPath,
              "location-main/gallery"
            );

          if (!galleryUrl) {
            throw new Error(
              "Cloudinary gallery image URL not returned"
            );
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

          ytVideoLink:
            ytVideoLink || "",

          mediaGallery: galleryImages,

          detail: detail || "",

          media: media || "",

          type: type || "",

          mediaType,

          siteCode:
            siteCode || "",

          latitude:
            latitude || "",

          longitude:
            longitude || "",

          metaTitle:
            metaTitle || "",

          metaKeywords:
            metaKeywords || "",

          metaDescription:
            metaDescription || "",

          mainImageAlt:
            mainImageAlt || "",

          featuredImageAlt:
            featuredImageAlt || "",

          schemaCode:
            schemaCode || "",

          status: 1,
        });

        // ==================================
        // SUCCESS
        // ==================================

        successCount++;

        console.log(
          `ROW ${i + 2} SUCCESS`
        );
      } catch (err) {
        failedCount++;

        const errorMessage =
          err?.message ||
          "Unknown error";

        console.error(
          `ROW ${i + 2} FAILED:`,
          errorMessage
        );

        errorLog.push({
          rowNo: i + 2,
          locationName,
          message: errorMessage,
        });
      }
    }

    // ======================================
    // UPDATE HISTORY
    // ======================================

    if (history) {
      history.totalRecords =
        validRows.length;

      history.successRecords =
        successCount;

      history.failedRecords =
        failedCount;

      history.errorLog =
        errorLog;

      history.status = "Completed";

      await history.save();

      console.log(
        "HISTORY UPDATED:",
        history._id
      );
    }

    // ======================================
    // RESPONSE
    // ======================================

    console.log("======================================");
    console.log("BULK UPLOAD COMPLETED");
    console.log(
      "TOTAL:",
      validRows.length
    );
    console.log(
      "SUCCESS:",
      successCount
    );
    console.log(
      "FAILED:",
      failedCount
    );
    console.log("======================================");

    return res.status(200).json({
      success: true,

      message:
        "Location Main bulk upload completed",

      data: {
        totalRecords:
          validRows.length,

        successRecords:
          successCount,

        failedRecords:
          failedCount,
      },
    });
  } catch (error) {
    // ======================================
    // MAIN ERROR
    // ======================================

    console.error(
      "======================================"
    );

    console.error(
      "Location Main Bulk Upload Error:",
      error
    );

    console.error(
      "======================================"
    );

    // ======================================
    // UPDATE HISTORY AS FAILED
    // ======================================

    if (history) {
      try {
        history.status = "Failed";

        history.errorLog = [
          {
            rowNo: 0,
            message:
              error?.message ||
              "Bulk upload failed",
          },
        ];

        await history.save();
      } catch (historyError) {
        console.error(
          "Failed to update bulk upload history:",
          historyError
        );
      }
    }

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Bulk upload failed",
    });
  } finally {
    // ======================================
    // DELETE MAIN EXTRACT FOLDER
    // ======================================

    try {
      if (
        mainExtractFolder &&
        fs.existsSync(mainExtractFolder)
      ) {
        fs.rmSync(mainExtractFolder, {
          recursive: true,
          force: true,
        });

        console.log(
          "Main temp folder deleted"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Main folder cleanup error:",
        cleanupError
      );
    }

    // ======================================
    // DELETE GALLERY EXTRACT FOLDER
    // ======================================

    try {
      if (
        galleryExtractFolder &&
        fs.existsSync(galleryExtractFolder)
      ) {
        fs.rmSync(galleryExtractFolder, {
          recursive: true,
          force: true,
        });

        console.log(
          "Gallery temp folder deleted"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Gallery folder cleanup error:",
        cleanupError
      );
    }

    // ======================================
    // DELETE EXCEL
    // ======================================

    try {
      const excelPath =
        req.files?.excel?.[0]?.path;

      if (
        excelPath &&
        fs.existsSync(excelPath)
      ) {
        fs.unlinkSync(excelPath);

        console.log(
          "Excel temp file deleted"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Excel cleanup error:",
        cleanupError
      );
    }

    // ======================================
    // DELETE MAIN ZIP
    // ======================================

    try {
      const mainZipPath =
        req.files?.mainZip?.[0]?.path;

      if (
        mainZipPath &&
        fs.existsSync(mainZipPath)
      ) {
        fs.unlinkSync(mainZipPath);

        console.log(
          "Main ZIP temp file deleted"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Main ZIP cleanup error:",
        cleanupError
      );
    }

    // ======================================
    // DELETE GALLERY ZIP
    // ======================================

    try {
      const galleryZipPath =
        galleryZipFile?.path;

      if (
        galleryZipPath &&
        fs.existsSync(galleryZipPath)
      ) {
        fs.unlinkSync(galleryZipPath);

        console.log(
          "Gallery ZIP temp file deleted"
        );
      }
    } catch (cleanupError) {
      console.error(
        "Gallery ZIP cleanup error:",
        cleanupError
      );
    }

    console.log(
      "======================================"
    );
    console.log(
      "BULK UPLOAD CLEANUP COMPLETED"
    );
    console.log(
      "======================================"
    );
  }
};

// ==========================================
// LIST BULK UPLOAD HISTORY
// ==========================================

const getLocationMainBulkUploadList = async (
  req,
  res
) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const search =
      req.query.search
        ?.toString()
        .trim() || "";

    const skip =
      (page - 1) * limit;

    const filter = {};

    // ======================================
    // SEARCH BY FILE NAME
    // ======================================

    if (search) {
      filter.fileName = {
        $regex: search,
        $options: "i",
      };
    }

    // ======================================
    // GET RECORDS + TOTAL
    // ======================================

    const [
      records,
      total,
    ] = await Promise.all([
      LocationMainBulkUpload.find(
        filter
      )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      LocationMainBulkUpload.countDocuments(
        filter
      ),
    ]);

    // ======================================
    // RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,

      data: records,

      pagination: {
        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "Get Location Main Bulk Upload List Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch bulk upload list",

      error:
        error?.message ||
        "Unknown error",
    });
  }
};

// ==========================================
// GET BULK UPLOAD DETAIL
// ==========================================

const getLocationMainBulkUploadDetail = async (
  req,
  res
) => {
  try {
    const record =
      await LocationMainBulkUpload.findById(
        req.params.id
      ).lean();

    if (!record) {
      return res.status(404).json({
        success: false,

        message:
          "Bulk upload record not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: record,
    });
  } catch (error) {
    console.error(
      "Get Location Main Bulk Upload Detail Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to fetch bulk upload detail",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  bulkUploadLocationMain,
  getLocationMainBulkUploadList,
  getLocationMainBulkUploadDetail,
};