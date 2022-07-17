const express = require("express");
const mongoose = require("mongoose");

const {
  validateCreateCredential,
  validateUpdateCredential,
  validateDeleteCredential,
  validateFetchCredential,
} = require("../validation/cloudCredential");
const {
  addCredential,
  updateCredential,
  deleteCredential,
  getCredentials,
  getCredential,
} = require("../controllers/cloudCredential");
const { protect } = require("../middleware/auth");
const { encrypt } = require("../utils/encryption");

const router = express.Router();

router.post("/", protect, validateCreateCredential, async (req, res) => {
  try {
    const { cloud_provider_id, access_credential } = req.body;
    const encryptedAccessCredential = encrypt(
      JSON.stringify(access_credential)
    );
    let payload = {
      user: req.user.id,
      cloudProvider: mongoose.Types.ObjectId(cloud_provider_id),
      access_credential: encryptedAccessCredential,
    };
    let result = await addCredential(payload);
    return res.status(201).json({
      success: true,
      data: result,
      message: "Credentials Encrypted & Addded successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "server error" });
  }
});

router.put("/:id", protect, validateUpdateCredential, async (req, res) => {
  try {
    const { access_credential } = req.body;
    const encryptedAccessCredential = encrypt(
      JSON.stringify(access_credential)
    );
    let payload = {
      access_credential: encryptedAccessCredential,
    };
    let result = await updateCredential(req.params.id, payload);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Credential Updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.delete("/:id", protect, validateDeleteCredential, async (req, res) => {
  try {
    let result = await deleteCredential(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Credential Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    let results = await getCredentials(req.user.id);
    return res.status(200).json({
      success: true,
      data: results,
      message: "Credentials fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/:id", protect, validateFetchCredential, async (req, res) => {
  try {
    let results = await getCredential(req.params.id);
    return res.status(500).json({
      success: true,
      data: results,
      message: "Credentials fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
