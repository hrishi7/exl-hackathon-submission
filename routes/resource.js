const express = require("express");
const {
  vaidationCreateResource,
  validateDeleteResource,
} = require("../validation/resource");
const {
  addResource,
  deleteResource,
  getResource,
  getResources,
  uploadFileToCloud,
  downloadResource,
} = require("../controllers/resource");
const { compressFile } = require("../utils/fileUtils");
const { protect, checkQueryToken } = require("../middleware/auth");
const { validateHasCrediential } = require("../validation/cloudCrediential");
const multerConfiguration = require("../middleware/multer");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    let results = await getResources(req);
    res.json({
      status: 200,
      data: results,
      message: "Resources fetched successfully",
    });
  } catch (error) {
    res.json({ status: 500, message: "server error" });
  }
});

router.post(
  "/",
  protect,
  multerConfiguration.single("resourceFile"),
  vaidationCreateResource,
  validateHasCrediential,
  compressFile,
  uploadFileToCloud,
  async (req, res) => {
    try {
      if (!req.payload) {
        res.json({
          status: 500,
          error: "server error while uploading file try again later",
        });
      }
      let result = await addResource(req.payload);
      res.json({
        status: 201,
        data: result,
        message: "File Saved successfully",
      });
    } catch (error) {
      console.log(error);
      res.json({ status: 500, error: "server error" });
    }
  }
);

router.get("/:id", protect, async (req, res) => {
  try {
    let result = await getResource(req.params.id);
    res.json({
      status: 200,
      data: result,
      message: "Resource fetched successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.delete("/:id", protect, validateDeleteResource, async (req, res) => {
  try {
    let result = await deleteResource(req.params.id);
    res.json({
      status: 200,
      data: result,
      message: "Resource Deleted successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.get("/download/:fileKey", checkQueryToken, async (req, res) => {
  try {
    if (!req.params.fileKey) {
      return res.json({ status: 404, error: "fileKey is required" });
    }
    let result = await downloadResource(req.params.fileKey);
    if (!result) {
      return res.json({
        status: 500,
        error: "server error while downloading. Try again later.",
      });
    }
    res.attachment(result.fileName);
    result.readStream.pipe(res);
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

module.exports = router;
