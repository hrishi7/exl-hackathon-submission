const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
exports.vaidationCreateResource = async (req, res, next) => {
  if (!req.body.cloud_provider_id) {
    res
      .status(400)
      .json({ success: false, message: "cloud_provider_id is required" });
    await unlinkFile(req.file.path);
    return;
  }
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "resourceFile is required" });
  }
  next();
};

exports.vaidationCreateMultipleResource = async (req, res, next) => {
  if (!req.body.cloud_provider_id) {
    for (const file of req.files) {
      await unlinkFile(file.path);
    }

    return res
      .status(400)
      .json({ success: false, message: "cloud_provider_id is required" });
  }
  if (!req.files) {
    return res
      .status(400)
      .json({ success: false, message: "resourceFiles is required" });
  }
  next();
};

exports.validateDeleteResource = (req, res, next) => {
  next();
};
