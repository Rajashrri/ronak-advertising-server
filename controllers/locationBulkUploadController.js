const XLSX = require("xlsx");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");

const Location = require("../models/Location");
const LocationBulkUpload = require("../models/LocationBulkUpload");

const {
  uploadToCloudinary,
} = require("../utils/upload");


/* --------------------------------
   Slug Generate
-------------------------------- */

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};


/* --------------------------------
   Find Image Recursively
-------------------------------- */

/* --------------------------------
   Normalize File Name
-------------------------------- */
/* --------------------------------
   Normalize File Name
-------------------------------- */
const normalizeFileName = (name) => {
  if (!name) return "";

  let fileName = path
    .basename(
      String(name)
        .trim()
        .replace(/\\/g, "/")
    )
    .normalize("NFKC")
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, "")
    .replace(/^["']|["']$/g, "")
    .toLowerCase();

  // Remove duplicate image extension
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

/* --------------------------------
   Find Image Recursively
-------------------------------- */
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
      const fullPath = path.join(
        currentFolder,
        file.name
      );

      if (file.isDirectory()) {
        const found = scan(fullPath);

        if (found) {
          return found;
        }

        continue;
      }

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
          "IMAGE FOUND:",
          fullPath
        );

        return fullPath;
      }
    }

    return null;
  };

  return scan(folder);
};
/* --------------------------------
   Bulk Upload Locations
-------------------------------- */

const bulkUploadLocations =
  async (req, res) => {

    let extractFolder = null;
    let history = null;

    try {

      /* -------------------------
         Check Excel
      ------------------------- */

      if (
        !req.files ||
        !req.files.excel ||
        !req.files.excel.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Excel file required",
        });
      }


      /* -------------------------
         Check ZIP
      ------------------------- */

      if (
        !req.files.zip ||
        !req.files.zip.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "ZIP file required",
        });
      }


      const excelFile =
        req.files.excel[0];

      const zipFile =
        req.files.zip[0];


      /* -------------------------
         Create History
      ------------------------- */

      history =
        await LocationBulkUpload.create({
          fileName:
            excelFile.originalname,

          status: "Processing",

          totalRecords: 0,

          successRecords: 0,

          failedRecords: 0,

          errorLog: [],
        });


      /* -------------------------
         Read Excel
      ------------------------- */

      const workbook =
        XLSX.readFile(
          excelFile.path
        );

      if (
        !workbook.SheetNames.length
      ) {
        throw new Error(
          "Excel sheet not found"
        );
      }


      const sheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];


      const rows =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            defval: "",
          }
        );


      if (!rows.length) {

        history.status =
          "Failed";

        history.totalRecords = 0;

        await history.save();

        return res.status(400).json({
          success: false,
          message:
            "Excel file is empty",
        });
      }


      /* -------------------------
         Extract ZIP
      ------------------------- */

      extractFolder =
        path.join(
          __dirname,
          "../uploads/location-temp-" +
            history._id
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


      const zip =
        new AdmZip(
          zipFile.path
        );

      zip.extractAllTo(
        extractFolder,
        true
      );


      /* -------------------------
         Counters
      ------------------------- */

      let successCount = 0;

      let failedCount = 0;

      const errorLog = [];


      /* -------------------------
         Process Excel Rows
      ------------------------- */

      for (
        let i = 0;
        i < rows.length;
        i++
      ) {

        try {

          const row = rows[i];


          /* -------------------------
             Excel Fields
          ------------------------- */

          const locationName =
            row["Location Name"]
              ?.toString()
              .trim();

          const audience_reach =
            row[
              "Daily Audience Reach"
            ];

          const media_sites =
            row[
              "Ronak Media Sites"
            ]
              ?.toString()
              .trim();

          const ideal =
  row["Ideal for"]
    ?.toString()
    .trim();

const imageName =
  row["Location Image"]
    ?.toString()
    .trim();

console.log(
  "EXCEL IMAGE NAME:",
  JSON.stringify(imageName)
);

console.log(
  "EXTRACT FOLDER:",
  extractFolder
);

console.log(
  "EXTRACTED FILES:",
  fs.readdirSync(extractFolder, {
    recursive: true,
  })
);

          /* -------------------------
             Required Validation
          ------------------------- */

          if (
            !locationName ||
            audience_reach ===
              "" ||
            audience_reach ===
              undefined ||
            audience_reach ===
              null ||
            !media_sites ||
            !ideal ||
            !imageName
          ) {

            failedCount++;

            errorLog.push({
              rowNo: i + 2,

              locationName,

              message:
                "Required fields missing",
            });

            continue;
          }


          /* -------------------------
             Audience Reach Number
          ------------------------- */

          const audienceNumber =
            Number(
              audience_reach
            );


          if (
            Number.isNaN(
              audienceNumber
            )
          ) {

            failedCount++;

            errorLog.push({
              rowNo: i + 2,

              locationName,

              message:
                "Daily Audience Reach must be a number",
            });

            continue;
          }


          /* -------------------------
             Generate Slug
          ------------------------- */

          const slug =
            slugify(
              locationName
            );


          /* -------------------------
             Duplicate Check
          ------------------------- */

          const existing =
            await Location.findOne({
              slug,
            });


          if (existing) {

            failedCount++;

            errorLog.push({
              rowNo: i + 2,

              locationName,

              message:
                "Location already exists",
            });

            continue;
          }


          /* -------------------------
             Find Image in ZIP
          ------------------------- */

   const imagePath =
  findImageInFolder(
    extractFolder,
    imageName
  );

          if (!imagePath) {

            failedCount++;

            errorLog.push({
              rowNo: i + 2,

              locationName,

              message:
                `Image "${imageName}" not found in ZIP`,
            });

            continue;
          }


          /* -------------------------
             Upload Image Cloudinary
          ------------------------- */

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


          /* -------------------------
             Save Location
          ------------------------- */

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


          /* -------------------------
             Success
          ------------------------- */

          successCount++;

        } catch (err) {

          failedCount++;

          errorLog.push({

            rowNo: i + 2,

            locationName:
              rows[i][
                "Location Name"
              ],

            message:
              err.message ||
              "Unknown error",
          });
        }
      }


      /* -------------------------
         Update History
      ------------------------- */

      history.totalRecords =
        rows.length;

      history.successRecords =
        successCount;

      history.failedRecords =
        failedCount;

      history.errorLog =
        errorLog;

      history.status =
        "Completed";

      await history.save();


      /* -------------------------
         Response
      ------------------------- */

      return res.status(200).json({

        success: true,

        message:
          "Bulk upload completed",

        data: {

          totalRecords:
            rows.length,

          successRecords:
            successCount,

          failedRecords:
            failedCount,
        },
      });

    } catch (error) {

      /* -------------------------
         Update History Failed
      ------------------------- */

      if (history) {

        history.status =
          "Failed";

        history.errorLog = [
          {
            rowNo: 0,

            message:
              error.message,
          },
        ];

        await history.save();
      }


      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Bulk upload failed",
      });

    } finally {

      /* -------------------------
         Delete Extracted Files
      ------------------------- */

      if (
        extractFolder &&
        fs.existsSync(
          extractFolder
        )
      ) {

        fs.rmSync(
          extractFolder,
          {
            recursive: true,
            force: true,
          }
        );
      }


      /* -------------------------
         Delete Excel
      ------------------------- */

      if (
        req.files?.excel?.[0]?.path &&
        fs.existsSync(
          req.files.excel[0].path
        )
      ) {

        fs.unlinkSync(
          req.files.excel[0].path
        );
      }


      /* -------------------------
         Delete ZIP
      ------------------------- */

      if (
        req.files?.zip?.[0]?.path &&
        fs.existsSync(
          req.files.zip[0].path
        )
      ) {

        fs.unlinkSync(
          req.files.zip[0].path
        );
      }
    }
  };
const getBulkUploadList = async (req, res) => {
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
      LocationBulkUpload.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      LocationBulkUpload.countDocuments(filter),
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
    console.error("Get Bulk Upload List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bulk upload list",
      error: error.message,
    });
  }
};
module.exports = {
  bulkUploadLocations,
  getBulkUploadList,
};