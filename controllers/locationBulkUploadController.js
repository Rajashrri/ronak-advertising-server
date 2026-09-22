const XLSX = require("xlsx");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const Location = require("../models/Location");
const LocationBulkUpload = require("../models/LocationBulkUpload");

const {
  uploadToCloudinary,
} = require("../utils/upload");

// ==========================================
// CONTROLLER LOADED
// ==========================================

console.log(
  "=============================================="
);

console.log(
  "✅ LOCATION BULK UPLOAD CONTROLLER LOADED"
);

console.log(
  "__filename:",
  __filename
);

console.log(
  "=============================================="
);

// ==========================================
// SLUGIFY
// ==========================================

const slugify = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// ==========================================
// NORMALIZE FILE NAME
// ==========================================

const normalizeFileName = (name) => {
  if (!name) {
    return "";
  }

  let fileName = path
    .basename(
      String(name)
        .trim()
        .replace(/\\/g, "/")
    )
    .normalize("NFKC")
    .replace(
      /[\s\u200B-\u200D\uFEFF]+/g,
      ""
    )
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  // ==========================================
  // REMOVE DUPLICATE EXTENSION
  // Example:
  // image.webp.webp -> image.webp
  // ==========================================

  const imageExtensions = [
    ".webp",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ];

  for (const ext of imageExtensions) {
    if (fileName.endsWith(ext + ext)) {
      fileName = fileName.slice(
        0,
        -ext.length
      );

      break;
    }
  }

  return fileName;
};

// ==========================================
// FIND IMAGE RECURSIVELY
// ==========================================

const findImageInFolder = (
  folder,
  imageName
) => {
  const targetName =
    normalizeFileName(imageName);

  if (!targetName) {
    return null;
  }

  if (!fs.existsSync(folder)) {
    return null;
  }

  const scan = (currentFolder) => {
    const files = fs.readdirSync(
      currentFolder,
      {
        withFileTypes: true,
      }
    );

    for (const file of files) {
      const fullPath = path.join(
        currentFolder,
        file.name
      );

      // Directory
      if (file.isDirectory()) {
        const found = scan(fullPath);

        if (found) {
          return found;
        }

        continue;
      }

      // File
      const normalizedFileName =
        normalizeFileName(file.name);

      console.log(
        "CHECK IMAGE:",
        file.name,
        "=>",
        normalizedFileName,
        "TARGET:",
        targetName
      );

      if (
        normalizedFileName === targetName
      ) {
        console.log(
          "✅ IMAGE FOUND:",
          fullPath
        );

        return fullPath;
      }
    }

    return null;
  };

  return scan(folder);
};

// ==========================================
// GET CELL VALUE SAFELY
// ==========================================

const getCellValue = (
  row,
  key
) => {
  if (
    !row ||
    row[key] === undefined ||
    row[key] === null
  ) {
    return "";
  }

  return String(row[key]).trim();
};

// ==========================================
// BULK UPLOAD LOCATIONS
// ==========================================

const bulkUploadLocations = async (
  req,
  res
) => {
  let extractFolder = null;
  let history = null;

  const requestId =
    `${Date.now()}-` +
    Math.random()
      .toString(36)
      .substring(2, 8);

  console.log("");

  console.log(
    "=================================================="
  );

  console.log(
    `🔥 BULK UPLOAD REQUEST STARTED: ${requestId}`
  );

  console.log(
    "=================================================="
  );

  try {
    // ==========================================
    // REQUEST LOG
    // ==========================================

    console.log(
      "METHOD:",
      req.method
    );

    console.log(
      "URL:",
      req.originalUrl
    );

    console.log(
      "FILES:",
      Object.keys(req.files || {})
    );

    console.log(
      "REQ.FILES:",
      req.files
        ? Object.keys(req.files)
        : "NO FILES"
    );

    // ==========================================
    // CHECK EXCEL
    // ==========================================

    if (
      !req.files ||
      !req.files.excel ||
      !req.files.excel.length
    ) {
      console.log(
        "❌ EXCEL FILE NOT FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel file required",
      });
    }

    // ==========================================
    // CHECK ZIP
    // ==========================================

    if (
      !req.files.zip ||
      !req.files.zip.length
    ) {
      console.log(
        "❌ ZIP FILE NOT FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "ZIP file required",
      });
    }

    // ==========================================
    // GET FILES
    // ==========================================

    const excelFile =
      req.files.excel[0];

    const zipFile =
      req.files.zip[0];

    console.log(
      "EXCEL FILE:",
      excelFile.originalname
    );

    console.log(
      "EXCEL PATH:",
      excelFile.path
    );

    console.log(
      "ZIP FILE:",
      zipFile.originalname
    );

    console.log(
      "ZIP PATH:",
      zipFile.path
    );

    // ==========================================
    // FILE EXTENSION VALIDATION
    // ==========================================

    const excelExtension =
      path
        .extname(
          excelFile.originalname
        )
        .toLowerCase();

    const zipExtension =
      path
        .extname(
          zipFile.originalname
        )
        .toLowerCase();

    // Excel validation
    if (
      excelExtension !== ".xlsx" &&
      excelExtension !== ".xls"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only .xlsx or .xls Excel files are allowed",
      });
    }

    // ZIP validation
    if (
      zipExtension !== ".zip"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only .zip files are allowed",
      });
    }

    // ==========================================
    // CHECK LOCAL FILE EXISTS
    // ==========================================

    if (
      !fs.existsSync(
        excelFile.path
      )
    ) {
      console.log(
        "❌ EXCEL FILE DOES NOT EXIST:",
        excelFile.path
      );

      return res.status(400).json({
        success: false,
        message:
          "Uploaded Excel file could not be found",
      });
    }

    if (
      !fs.existsSync(
        zipFile.path
      )
    ) {
      console.log(
        "❌ ZIP FILE DOES NOT EXIST:",
        zipFile.path
      );

      return res.status(400).json({
        success: false,
        message:
          "Uploaded ZIP file could not be found",
      });
    }

    // ==========================================
    // UPLOAD EXCEL TO CLOUDINARY
    // ==========================================
    //
    // IMPORTANT:
    // raw = Excel file
    // false = local file ko abhi delete mat karo
    //
    // Excel ko read karna hai:
    // XLSX.readFile(excelFile.path)
    //
    // ==========================================

    console.log(
      "☁️ UPLOADING EXCEL TO CLOUDINARY..."
    );

    const excelCloudinaryUrl =
      await uploadToCloudinary(
        excelFile.path,
        "location-bulk-files",
        "raw",
        false
      );

    if (!excelCloudinaryUrl) {
      throw new Error(
        "Cloudinary Excel URL not returned"
      );
    }

    console.log(
      "✅ EXCEL CLOUDINARY URL:",
      excelCloudinaryUrl
    );

    // ==========================================
    // READ EXCEL
    //
    // HISTORY IS NOT CREATED YET
    // ==========================================

    console.log(
      "📖 READING EXCEL..."
    );

    let workbook;

    try {
      workbook =
        XLSX.readFile(
          excelFile.path,
          {
            cellDates: true,
          }
        );
    } catch (excelError) {
      console.error(
        "❌ EXCEL READ ERROR:",
        excelError
      );

      return res.status(400).json({
        success: false,
        message:
          "Invalid or corrupted Excel file",
      });
    }

    // ==========================================
    // SHEET VALIDATION
    // ==========================================

    if (
      !workbook.SheetNames ||
      !workbook.SheetNames.length
    ) {
      console.log(
        "❌ NO SHEET FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel file does not contain any sheet",
      });
    }

    console.log(
      "SHEETS:",
      workbook.SheetNames
    );

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    if (!sheet) {
      console.log(
        "❌ FIRST SHEET NOT FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel sheet not found",
      });
    }

    // ==========================================
    // SHEET RANGE VALIDATION
    // ==========================================

    const sheetRange =
      sheet["!ref"];

    console.log(
      "SHEET RANGE:",
      sheetRange
    );

    if (!sheetRange) {
      console.log(
        "❌ EXCEL SHEET IS COMPLETELY EMPTY"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel file is empty. Please add data before uploading.",
      });
    }

    // ==========================================
    // READ RAW EXCEL
    // ==========================================

    const rawRows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          header: 1,
          defval: "",
          blankrows: false,
        }
      );

    console.log(
      "RAW ROW COUNT:",
      rawRows.length
    );

    // ==========================================
    // REMOVE COMPLETELY EMPTY ROWS
    // ==========================================

    const nonEmptyRows =
      rawRows.filter(
        (row) => {
          if (!Array.isArray(row)) {
            return false;
          }

          return row.some(
            (cell) =>
              String(
                cell ?? ""
              ).trim() !== ""
          );
        }
      );

    console.log(
      "NON EMPTY ROW COUNT:",
      nonEmptyRows.length
    );

    // ==========================================
    // NO ROW
    // ==========================================

    if (
      nonEmptyRows.length === 0
    ) {
      console.log(
        "❌ EXCEL HAS NO DATA"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel file is empty. Please add data before uploading.",
      });
    }

    // ==========================================
    // HEADER VALIDATION
    // ==========================================

    const headerRow =
      nonEmptyRows[0];

    console.log(
      "HEADER ROW:",
      headerRow
    );

    const hasHeader =
      headerRow.some(
        (cell) =>
          String(
            cell ?? ""
          ).trim() !== ""
      );

    if (!hasHeader) {
      console.log(
        "❌ HEADER NOT FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel header row is missing",
      });
    }

    // ==========================================
    // DATA ROWS
    // ==========================================

    const dataRows =
      nonEmptyRows.slice(1);

    console.log(
      "DATA ROW COUNT:",
      dataRows.length
    );

    // ==========================================
    // HEADER ONLY
    // ==========================================

    if (
      dataRows.length === 0
    ) {
      console.log(
        "❌ EXCEL CONTAINS HEADER ONLY"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel contains headers but no data rows. Please add at least one record.",
      });
    }

    // ==========================================
    // CHECK ACTUAL DATA
    // ==========================================

    const hasActualData =
      dataRows.some(
        (row) => {
          if (!Array.isArray(row)) {
            return false;
          }

          return row.some(
            (cell) =>
              String(
                cell ?? ""
              ).trim() !== ""
          );
        }
      );

    if (!hasActualData) {
      console.log(
        "❌ NO ACTUAL DATA FOUND"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel contains no actual data. Please add at least one record.",
      });
    }

    // ==========================================
    // CONVERT TO OBJECT ROWS
    // ==========================================

    const rows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          defval: "",
          raw: false,
          blankrows: false,
        }
      );

    console.log(
      "OBJECT ROW COUNT:",
      rows.length
    );

    // ==========================================
    // REMOVE EMPTY OBJECT ROWS
    // ==========================================

    const validRows =
      rows.filter(
        (row) => {
          return Object.values(
            row
          ).some(
            (value) =>
              String(
                value ?? ""
              ).trim() !== ""
          );
        }
      );

    console.log(
      "VALID EXCEL ROW COUNT:",
      validRows.length
    );

    // ==========================================
    // FINAL EMPTY VALIDATION
    // ==========================================

    if (
      validRows.length === 0
    ) {
      console.log(
        "❌ NO VALID EXCEL ROWS"
      );

      return res.status(400).json({
        success: false,
        message:
          "Excel contains no valid data rows.",
      });
    }

    // ==========================================
    // IMPORTANT:
    // HISTORY CREATED ONLY AFTER
    // EXCEL VALIDATION PASSES
    // ==========================================

    console.log(
      "✅ EXCEL VALIDATION PASSED"
    );

    console.log(
      "🔥 CREATING HISTORY NOW..."
    );

    history =
      await LocationBulkUpload.create({
        fileName:
          excelFile.originalname,

        excelFilePath:
          excelCloudinaryUrl,

        status:
          "Processing",

        totalRecords:
          0,

        successRecords:
          0,

        failedRecords:
          0,

        errorLog: [],
      });

    console.log(
      "✅ HISTORY CREATED:",
      history._id
    );

    // ==========================================
    // CREATE EXTRACT FOLDER
    // ==========================================

    extractFolder =
      path.join(
        __dirname,
        "../uploads/location-temp-" +
          history._id
      );

    console.log(
      "EXTRACT FOLDER:",
      extractFolder
    );

    if (
      !fs.existsSync(
        extractFolder
      )
    ) {
      fs.mkdirSync(
        extractFolder,
        {
          recursive: true,
        }
      );
    }

    // ==========================================
    // EXTRACT ZIP
    // ==========================================

    console.log(
      "📦 EXTRACTING ZIP..."
    );

    let zip;

    try {
      zip =
        new AdmZip(
          zipFile.path
        );

      zip.extractAllTo(
        extractFolder,
        true
      );

    } catch (zipError) {
      console.error(
        "❌ ZIP EXTRACTION ERROR:",
        zipError
      );

      throw new Error(
        "Invalid or corrupted ZIP file"
      );
    }

    console.log(
      "✅ ZIP EXTRACTED"
    );

    // ==========================================
    // DEBUG EXTRACTED FILES
    // ==========================================

    try {
      const extractedFiles =
        fs.readdirSync(
          extractFolder,
          {
            recursive: true,
          }
        );

      console.log(
        "EXTRACTED FILES:",
        extractedFiles
      );

    } catch (fileError) {
      console.log(
        "Unable to list extracted files:",
        fileError.message
      );
    }

    // ==========================================
    // COUNTERS
    // ==========================================

    let successCount = 0;
    let failedCount = 0;

    const errorLog = [];

    // ==========================================
    // PROCESS EACH ROW
    // ==========================================

    for (
      let i = 0;
      i < validRows.length;
      i++
    ) {
      const row =
        validRows[i];

      const excelRowNumber =
        i + 2;

      let locationName = "";

      try {
        console.log("");

        console.log(
          "------------------------------------------"
        );

        console.log(
          `PROCESSING ROW: ${excelRowNumber}`
        );

        console.log(
          "ROW DATA:",
          row
        );

        // ======================================
        // EXCEL FIELDS
        // ======================================

        locationName =
          getCellValue(
            row,
            "Location Name"
          );

        const audience_reach =
          row[
            "Daily Audience Reach"
          ];

        const media_sites =
          getCellValue(
            row,
            "Ronak Media Sites"
          );

        const ideal =
          getCellValue(
            row,
            "Ideal for"
          );

        const imageName =
          getCellValue(
            row,
            "Location Image"
          );

        console.log(
          "LOCATION NAME:",
          locationName
        );

        console.log(
          "IMAGE NAME:",
          imageName
        );

        // ======================================
        // REQUIRED VALIDATION
        // ======================================

        if (
          !locationName ||
          audience_reach === "" ||
          audience_reach === undefined ||
          audience_reach === null ||
          !media_sites ||
          !ideal ||
          !imageName
        ) {
          throw new Error(
            "Required fields missing"
          );
        }

        // ======================================
        // AUDIENCE NUMBER
        // ======================================

        const audienceNumber =
          Number(
            audience_reach
          );

        if (
          Number.isNaN(
            audienceNumber
          )
        ) {
          throw new Error(
            "Daily Audience Reach must be a number"
          );
        }

        // ======================================
        // SLUG
        // ======================================

        const slug =
          slugify(
            locationName
          );

        if (!slug) {
          throw new Error(
            "Unable to generate slug"
          );
        }

        console.log(
          "SLUG:",
          slug
        );

        // ======================================
        // DUPLICATE CHECK
        // ======================================

        const existing =
          await Location.findOne({
            slug,
          });

        if (existing) {
          throw new Error(
            "Location already exists"
          );
        }

        // ======================================
        // FIND IMAGE
        // ======================================

        console.log(
          "🔍 SEARCHING IMAGE:",
          imageName
        );

        const imagePath =
          findImageInFolder(
            extractFolder,
            imageName
          );

        if (!imagePath) {
          throw new Error(
            `Image "${imageName}" not found in ZIP`
          );
        }

        console.log(
          "IMAGE PATH:",
          imagePath
        );

        // ======================================
        // UPLOAD IMAGE TO CLOUDINARY
        // ======================================

        console.log(
          "☁️ UPLOADING IMAGE TO CLOUDINARY..."
        );

        const imageUrl =
          await uploadToCloudinary(
            imagePath,
            "locations"
          );

        if (!imageUrl) {
          throw new Error(
            "Cloudinary image URL not returned"
          );
        }

        console.log(
          "✅ CLOUDINARY IMAGE URL:",
          imageUrl
        );

        // ======================================
        // CREATE LOCATION
        // ======================================

        const createdLocation =
          await Location.create({
            locationName,

            audience_reach:
              audienceNumber,

            media_sites,

            ideal,

            image:
              imageUrl,

            slug,

            status: 1,
          });

        console.log(
          "✅ LOCATION CREATED:",
          createdLocation._id
        );

        successCount++;

        console.log(
          `✅ ROW ${excelRowNumber} SUCCESS`
        );

      } catch (err) {
        failedCount++;

        console.error(
          `❌ ROW ${excelRowNumber} FAILED:`,
          err.message
        );

        errorLog.push({
          rowNo:
            excelRowNumber,

          locationName,

          message:
            err.message ||
            "Unknown error",
        });
      }
    }

    // ==========================================
    // UPDATE HISTORY
    // ==========================================

    console.log("");

    console.log(
      "=========================================="
    );

    console.log(
      "UPDATING HISTORY"
    );

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

    console.log(
      "=========================================="
    );

    history.totalRecords =
      validRows.length;

    history.successRecords =
      successCount;

    history.failedRecords =
      failedCount;

    history.errorLog =
      errorLog;

    history.status =
      "Completed";

    await history.save();

    console.log(
      "✅ HISTORY UPDATED:",
      history._id
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "Bulk upload completed",

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
    // ==========================================
    // GLOBAL ERROR
    // ==========================================

    console.error("");

    console.error(
      "=========================================="
    );

    console.error(
      `❌ BULK UPLOAD FAILED: ${requestId}`
    );

    console.error(
      "ERROR:",
      error
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error(
      "=========================================="
    );

    // ==========================================
    // UPDATE HISTORY ONLY IF CREATED
    // ==========================================

    if (history) {
      try {
        history.status =
          "Failed";

        history.errorLog = [
          {
            rowNo: 0,

            message:
              error.message ||
              "Bulk upload failed",
          },
        ];

        await history.save();

        console.log(
          "❌ HISTORY MARKED FAILED:",
          history._id
        );

      } catch (historyError) {
        console.error(
          "History update failed:",
          historyError
        );
      }

    } else {
      console.log(
        "ℹ️ NO HISTORY CREATED BECAUSE VALIDATION FAILED BEFORE HISTORY CREATION"
      );
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Bulk upload failed",
    });

  } finally {
    // ==========================================
    // DELETE EXTRACT FOLDER
    // ==========================================

    if (
      extractFolder &&
      fs.existsSync(
        extractFolder
      )
    ) {
      try {
        fs.rmSync(
          extractFolder,
          {
            recursive: true,
            force: true,
          }
        );

        console.log(
          "🗑️ EXTRACT FOLDER DELETED"
        );

      } catch (cleanupError) {
        console.error(
          "Extract folder cleanup error:",
          cleanupError.message
        );
      }
    }

    // ==========================================
    // DELETE LOCAL EXCEL
    // ==========================================

    if (
      req.files?.excel?.[0]?.path &&
      fs.existsSync(
        req.files.excel[0].path
      )
    ) {
      try {
        fs.unlinkSync(
          req.files.excel[0].path
        );

        console.log(
          "🗑️ EXCEL FILE DELETED"
        );

      } catch (cleanupError) {
        console.error(
          "Excel cleanup error:",
          cleanupError.message
        );
      }
    }

    // ==========================================
    // DELETE LOCAL ZIP
    // ==========================================

    if (
      req.files?.zip?.[0]?.path &&
      fs.existsSync(
        req.files.zip[0].path
      )
    ) {
      try {
        fs.unlinkSync(
          req.files.zip[0].path
        );

        console.log(
          "🗑️ ZIP FILE DELETED"
        );

      } catch (cleanupError) {
        console.error(
          "ZIP cleanup error:",
          cleanupError.message
        );
      }
    }

    console.log(
      `🏁 BULK UPLOAD REQUEST FINISHED: ${requestId}`
    );
  }
};

// ==========================================
// GET BULK UPLOAD LIST
// ==========================================

const getBulkUploadList = async (
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

    if (search) {
      filter.fileName = {
        $regex: search,
        $options: "i",
      };
    }

    const [
      records,
      total,
    ] = await Promise.all([
      LocationBulkUpload.find(
        filter
      )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      LocationBulkUpload.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,

      data: records,

      pagination: {
        total,

        page,

        limit,

        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    });

  } catch (error) {
    console.error(
      "Get Bulk Upload List Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch bulk upload list",

      error:
        error.message,
    });
  }
};

// ==========================================
// DOWNLOAD EXCEL
// ==========================================

const downloadExcel = async (
  req,
  res
) => {
  try {
    const record =
      await LocationBulkUpload.findById(
        req.params.id
      );

    if (
      !record ||
      !record.excelFilePath
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Excel file not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        fileName:
          record.fileName,

        fileUrl:
          record.excelFilePath,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,

      message:
        error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  bulkUploadLocations,
  getBulkUploadList,
  downloadExcel,
};