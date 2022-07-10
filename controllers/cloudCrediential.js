const CloudCrediential = require("../models/CloudCrediential");
const mongoose = require("mongoose");

//@desc     Add provider crediential
//@route    Post /api/v1/cloud-crediential/
//@access   Private
exports.addCrediential = async (payload) => {
  return await new CloudCrediential(payload).save();
};

//@desc     Update provider crediential
//@route    PUT /api/v1/cloud-crediential/:id
//@access   Private
exports.updateCrediential = async (id, payload) => {
  return await CloudCrediential.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: payload },
    { new: true }
  );
};

//@desc     Delete provider crediential
//@route    DELETE /api/v1/cloud-crediential/:id
//@access   Private
exports.deleteCrediential = async (id, payload) => {
  return await CloudCrediential.findOneAndDelete({
    _id: mongoose.Types.ObjectId(id),
  });
};

//@desc     get provider crediential
//@route    GET /api/v1/cloud-crediential/
//@access   Private
exports.getCredientials = async (userId) => {
  return await CloudCrediential.find({
    user: mongoose.Types.ObjectId(userId),
  });
};

//@desc     get provider crediential
//@route    GET /api/v1/cloud-crediential/:id
//@access   Private
exports.getCrediential = async (id) => {
  return await CloudCrediential.findOne({
    _id: mongoose.Types.ObjectId(id),
  });
};
