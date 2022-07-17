const express = require("express");

const {
  addTemporaryUrl,
  updateTemporaryUrl,
  deleteTemporaryUrl,
  getTemporaryUrl,
} = require("../controllers/temporaryUrl");
const {
  validateCreateTemporaryUrl,
  validateUpdateTemporaryUrl,
} = require("../validation/temporaryUrl");
const { downloadResource } = require("../controllers/resource");
const { protect } = require("../middleware/auth");
const randomstring = require("randomstring");
const mongoose = require("mongoose");

const router = express.Router();

//  (((1000 * 60) - 1seconds * 60 )- 1hour - * 24 )- 1day
router.post("/", protect, validateCreateTemporaryUrl, async (req, res) => {
  try {
    const { resource_id, shared_on, expires_in } = req.body;
    let payload = {
      resource: mongoose.Types.ObjectId(resource_id),
      urlSlug: randomstring.generate(10),
      sharedOn: shared_on ? new Date(shared_on) : new Date(),
      expiresIn: expires_in ? parseInt(expires_in) * 1000 * 60 : 1000 * 60 * 5, //default keep it 5 min
    };
    let result = await addTemporaryUrl(payload);
    res.status(201).json({
      success: true,
      message: "Temporary Access Url is generated",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.patch("/:id", protect, validateUpdateTemporaryUrl, async (req, res) => {
  try {
    const { shared_on, expires_in } = req.body;
    let payload = {};
    if (shared_on) {
      payload["sharedOn"] = new Date(shared_on);
    }
    if (expires_in) {
      payload["expiresIn"] = parseInt(expires_in) * 1000 * 60;
    }
    let result = await updateTemporaryUrl(req.params.id, payload);
    res.status(200).json({
      success: true,
      message: "Temporary Access Url is Updated",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    if (!req.params.id) {
      return res
        .status(401)
        .json({ success: false, message: "Please provide id to delete" });
    }

    let result = await deleteTemporaryUrl(req.params.id);
    res.status(200).json({
      success: true,
      message: "Temporary Access Url is deleted",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/download/:urlSlug", async (req, res) => {
  try {
    if (!req.params.urlSlug) {
      return res
        .status(401)
        .json({ success: false, message: "urlSlug is required" });
    }
    let urlDetails = await getTemporaryUrl(req.params.urlSlug);
    if (!urlDetails) {
      return res.status(401).json({
        success: false,
        message: "url is either invalid or expired.",
      });
    }
    let result = await downloadResource(urlDetails.resource.fileKey);
    if (!result) {
      return res.status(500).json({
        success: false,
        message: "server error while downloading. Try again later.",
      });
    }
    res.attachment(result.fileName);
    result.readStream.pipe(res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "server error while downloading. Try again later.",
    });
  }
});

module.exports = router;
