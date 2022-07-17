const express = require("express");
const {
  vaidationCreateResource,
  vaidationCreateMultipleResource,
  validateDeleteResource,
} = require("../validation/resource");
const {
  addResource,
  addMultipleResource,
  deleteResource,
  getResource,
  getResources,
  uploadFileToCloud,
  uploadMultipleFileToCloud,
  downloadResource,
} = require("../controllers/resource");
const { compressFile, compressMultipleFile } = require("../utils/fileUtils");
const { protect, checkQueryToken } = require("../middleware/auth");
const {
  validateHasCredential,
  validateHasCredentialMultipleResource,
} = require("../validation/cloudCredential");
const multerConfiguration = require("../middleware/multer");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    let results = await getResources(req);
    res.status(200).json({
      success: true,
      data: results,
      message: "Resources fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.post(
  "/",
  protect,
  multerConfiguration.single("resourceFile"),
  vaidationCreateResource,
  validateHasCredential,
  compressFile,
  uploadFileToCloud,
  async (req, res) => {
    try {
      if (!req.payload) {
        res.status(500).json({
          success: false,
          message: "server error while uploading file try again later",
        });
      }
      let result = await addResource(req.payload);
      res.status(201).json({
        success: true,
        data: result,
        message: "File Saved successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "server error" });
    }
  }
);

router.post(
  "/upload-multiple",
  protect,
  multerConfiguration.array("resourceFiles"),
  vaidationCreateMultipleResource,
  validateHasCredentialMultipleResource,
  compressMultipleFile,
  uploadMultipleFileToCloud,
  async (req, res) => {
    try {
      if (!req.payloads && !req.payloads) {
        res.status(500).json({
          success: false,
          message: "server error while uploading file try again later",
        });
      }
      let result = await addMultipleResource(req.payloads);
      res.status(201).json({
        success: true,
        data: result,
        message: "Files Saved successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "server error" });
    }
  }
);

router.get("/:id", protect, async (req, res) => {
  try {
    let result = await getResource(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      message: "Resource fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.delete("/:id", protect, validateDeleteResource, async (req, res) => {
  try {
    let result = await deleteResource(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data: result,
      message: "Resource Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/download/:fileKey", checkQueryToken, async (req, res) => {
  try {
    if (!req.params.fileKey) {
      return res
        .status(404)
        .json({ success: false, message: "fileKey is required" });
    }
    let result = await downloadResource(req.params.fileKey);
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "server error while downloading. Try again later.",
      });
    }
    res.attachment(result.fileName);
    result.readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
