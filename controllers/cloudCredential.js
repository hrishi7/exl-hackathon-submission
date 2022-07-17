const CloudCredential = require("../models/CloudCredential");
const { decrypt } = require("../utils/encryption");
const mongoose = require("mongoose");

//@desc     Add provider credential
//@route    Post /api/v1/cloud-credential/
//@access   Private
exports.addCredential = async (payload) => {
  return await new CloudCredential(payload).save();
};

//@desc     Update provider credential
//@route    PUT /api/v1/cloud-credential/:id
//@access   Private
exports.updateCredential = async (id, payload) => {
  return await CloudCredential.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(id) },
    { $set: payload },
    { new: true }
  );
};

//@desc     Delete provider credential
//@route    DELETE /api/v1/cloud-credential/:id
//@access   Private
exports.deleteCredential = async (id, payload) => {
  return await CloudCredential.findOneAndDelete({
    _id: mongoose.Types.ObjectId(id),
  });
};

//@desc     get provider credential
//@route    GET /api/v1/cloud-credential/
//@access   Private
exports.getCredentials = async (userId) => {
  let credentials = await CloudCredential.find({
    user: mongoose.Types.ObjectId(userId),
  });
  return credentials.map((c) => ({
    ...c._doc,
    access_credential: this.getDecryptedData(c._doc),
  }));
};

//@desc     get provider credential
//@route    GET /api/v1/cloud-credential/:id
//@access   Private
exports.getCredential = async (id) => {
  let credential = await CloudCredential.findOne({
    _id: mongoose.Types.ObjectId(id),
  });
  return {
    ...credential._doc,
    access_credential: this.getDecryptedData(credential),
  };
};

exports.getDecryptedData = (doc) => {
  return JSON.parse(decrypt(doc.access_credential));
};
