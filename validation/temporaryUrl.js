const TemporaryUrl = require("../models/TemporaryUrl");
exports.validateCreateTemporaryUrl = async (req, res, next) => {
  if (!req.user) {
    return res.json({ status: 400, message: "User not found" });
  }
  if (!req.body.resource_id) {
    return res.json({ status: 400, message: "resource_id is required" });
  }

  if (!this.validUser(req.params.id, req.user.id)) {
    return res.json({
      status: 404,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validateUpdateTemporaryUrl = async (req, res, next) => {
  if (!req.params.id) {
    return res.json({ status: 400, message: "id is required" });
  }
  if (!this.validUser(req.params.id, req.user.id)) {
    return res.json({
      status: 404,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validUser = async (temporaryUrlId, userId) => {
  try {
    return (await TemporaryUrl.aggregate([
      {
        _id: mongoose.Types.ObjectId(temporaryUrlId),
      },
      {
        $lookup: {
          from: "Resource",
          localField: "_id",
          foreignField: "resource",
          as: "resourceData",
        },
      },
      { $unwind: "$resourceData" },
      { $match: { "$resourceData.user": mongoose.Types.ObjectId(userId) } },
    ]))
      ? true
      : false;
  } catch (error) {
    return false;
  }
};
