const express = require("express");
const mongoose = require("mongoose");

const {
  validateCreateCrediential,
  validateUpdateCrediential,
  validateDeleteCrediential,
  validateFetchCrediential,
} = require("../validation/cloudCrediential");
const {
  addCrediential,
  updateCrediential,
  deleteCrediential,
  getCredientials,
  getCrediential,
} = require("../controllers/cloudCrediential");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, validateCreateCrediential, async (req, res) => {
  try {
    const { cloud_provider_id, access_crediential } = req.body;
    //TODO encrypt the crediential for making a util function (encryptCloudCrediential)
    let payload = {
      user: req.user.id,
      cloudProvider: mongoose.Types.ObjectId(cloud_provider_id),
      access_crediential,
    };
    let result = await addCrediential(payload);
    res.json({
      status: 201,
      data: result,
      message: "Crediential Addded successfully",
    });
  } catch (error) {
    console.log(err);
    res.json({ status: 500, error: "server error" });
  }
});

router.put("/:id", protect, validateUpdateCrediential, async (req, res) => {
  try {
    const { access_crediential } = req.body;
    //TODO encrypt the crediential for making a util function (encryptCloudCrediential)
    let payload = {
      access_crediential,
    };
    let result = await updateCrediential(req.params.id, payload);
    res.json({
      status: 200,
      data: result,
      message: "Crediential Updated successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.delete("/:id", protect, validateDeleteCrediential, async (req, res) => {
  try {
    let result = await deleteCrediential(req.params.id);
    res.json({
      status: 200,
      data: result,
      message: "Crediential Deleted successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    let results = await getCredientials(req.user.id);
    res.json({
      status: 200,
      data: results,
      message: "Credientials fetched successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.get("/:id", protect, validateFetchCrediential, async (req, res) => {
  try {
    let results = await getCrediential(req.params.id);
    res.json({
      status: 200,
      data: results,
      message: "Credientials fetched successfully",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

module.exports = router;
