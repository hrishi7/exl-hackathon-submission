const express = require("express");

const {
  addProviders,
  getSupportedProviders,
  getProvider,
} = require("../controllers/cloudProvider");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await addProviders();
    res.status(201).json({
      success: true,
      message: "Basic 3 Providers added",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    let providers = await getSupportedProviders();
    res
      .status(200)
      .json({ success: true, data: providers, message: "Got Providers list" });
  } catch (error) {
    res.status(500).json({ success: false, message: "server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      res.status(400).json({ success: false, message: "Please provide id" });
      return;
    }
    let providers = await getProvider(req.params.id);
    res
      .status(200)
      .json({ success: true, data: providers, message: "Got Provider" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "server error" });
  }
});

module.exports = router;
