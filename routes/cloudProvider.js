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
    res.json({
      status: 200,
      message: "Basic 3 Providers added",
    });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    let providers = await getSupportedProviders();
    res.json({ status: 200, data: providers, message: "Got Providers list" });
  } catch (error) {
    res.json({ status: 500, error: "server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      res.json({ status: 400, message: "Please provide id" });
      return;
    }
    let providers = await getProvider(req.params.id);
    res.json({ status: 200, data: providers, message: "Got Provider" });
  } catch (error) {
    console.log(error);
    res.json({ status: 500, error: "server error" });
  }
});

module.exports = router;
