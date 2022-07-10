const TemporaryUrl = require("../models/TemporaryUrl");
const mongoose = require("mongoose");

//@desc     Add Temporary Url
//@route    Post /api/v1/temporary-url/
//@access   Private
exports.addTemporaryUrl = async (payload) => {
  let response = await new TemporaryUrl(payload).save();
  return {
    _id: response._id,
    expiresIn: `${parseInt(response.expiresIn) / 60000} minutes`,
    guestAccessLink: `${process.env.API_SERVER_ENDPOINT}/api/v1/temporary-url/download/${response.urlSlug}`,
  };
};

//@desc     Update Temporary Url
//@route    PUT /api/v1/temporary-url/:id
//@access   Private
exports.updateTemporaryUrl = async (id, payload) => {
  return await TemporaryUrl.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: payload },
    { new: true }
  );
};

//@desc     Delete Temporary Url
//@route    DELETE /api/v1/temporary-url/:id
//@access   Private
exports.deleteTemporaryUrl = async (id) => {
  return await TemporaryUrl.findOneAndDelete({
    _id: mongoose.Types.ObjectId(id),
  });
};

//@desc     Get Temporary Url
//@route    GET /api/v1/temporary-url/download/:urlSlug
//@access   Public for Guest User
exports.getTemporaryUrl = async (urlSlug) => {
  let result = await TemporaryUrl.findOne({ urlSlug }).populate("resource");
  let validUrl =
    new Date(result.sharedOn) >= new Date(Date.now() - result.expiresIn);
  return validUrl ? result : null;
};
