const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
exports.vaidationCreateResource = async (req, res, next) => {
  if (!req.body.cloud_provider_id) {
    res.json({ status: 400, error: "cloud_provider_id is required" });
    await unlinkFile(req.file.path);
    return;
  }
  if (!req.file) {
    res.json({ status: 400, error: "resourceFile is required" });
    await unlinkFile(req.file.path);
    return;
  }
  next();
};

exports.validateDeleteResource = (req, res, next) => {
  next();
};
