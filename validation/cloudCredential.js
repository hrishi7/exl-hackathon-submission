const CloudCredential = require("../models/CloudCredential");
const CloudProvider = require("../models/CloudProvider");
const { getDecryptedData } = require("../controllers/cloudCredential");
const mongoose = require("mongoose");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

exports.validateCreateCredential = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User Not Found" });
  }
  if (!req.body.cloud_provider_id) {
    return res.status(400).json({
      success: false,
      message: "Please Provide Cloud Provider id",
    });
  }
  if (!req.body.access_credential) {
    return res.status(400).json({
      success: false,
      message: "Please Provide Cloud Access Keys as Key:val pair",
    });
  }
  let provider = await CloudProvider.findOne({
    _id: mongoose.Types.ObjectId(req.body.cloud_provider_id),
  });
  if (!provider) {
    return res
      .status(400)
      .json({ success: false, message: "Cloud Provider Not Found" });
  }
  let valid = this.validCredformat(req, provider);
  if (valid.error)
    return res.status(400).json({
      success: false,
      message: valid.message,
    });
  next();
};

exports.validateUpdateCredential = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User Not Found" });
  }
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Please Provide credential id to update",
    });
  }

  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.status(401).json({
      success: false,
      message: "You are Not Authorized to Update",
    });
  }
  let cred = await CloudCredential.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }).populate("cloudProvider");
  cred = {
    ...cred._doc,
    access_credential: getDecryptedData(cred),
  };

  let provider = cred.cloudProvider;
  if (!provider) {
    return res
      .status(400)
      .json({ success: false, message: "Cloud Provider Not Found" });
  }
  let valid = this.validCredformat(req, provider);
  if (valid.error)
    return res.status(400).json({
      success: false,
      message: valid.message,
    });
  next();
};

exports.validateDeleteCredential = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User Not Found" });
  }
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Please Provide credential id to delete",
    });
  }
  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.status(401).json({
      success: false,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validateFetchCredential = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User Not Found" });
  }
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Please Provide credential id to delete",
    });
  }
  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.status(401).json({
      success: false,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validateHasCredential = async (req, res, next) => {
  let existCredential = await CloudCredential.findOne({
    user: mongoose.Types.ObjectId(req.user.id),
    cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
  });
  if (!existCredential) {
    res.status(400).json({
      success: false,
      message:
        "Credential Not Found For this Provider, Please add credential first",
    });
    await unlinkFile(req.file.path);
    return;
  }
  next();
};

exports.validateHasCredentialMultipleResource = async (req, res, next) => {
  let existCredential = await CloudCredential.findOne({
    user: mongoose.Types.ObjectId(req.user.id),
    cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
  });
  if (!existCredential) {
    for (const file of req.files) {
      await unlinkFile(file.path);
    }
    return res.status(400).json({
      success: false,
      message:
        "Credential Not Found For this Provider, Please add credential first",
    });
  }
  next();
};

exports.foundCred = async (credentialId, userId) => {
  try {
    return (await CloudCredential.findOne({
      _id: mongoose.Types.ObjectId(credentialId),
      user: mongoose.Types.ObjectId(userId),
    }))
      ? true
      : false;
  } catch (error) {
    return false;
  }
};

exports.validCredformat = (req, provider) => {
  if (provider.name === "Google" && provider.serviceName === "gcs") {
    if (
      !req.body.access_credential.GCS_PROJECT_ID ||
      !req.body.access_credential.GCS_BUCKET_NAME ||
      !req.body.access_credential.GCS_KEYS_JSON
    ) {
      return {
        error: true,
        message: `Invalid credential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  if (provider.name === "Aws" && provider.serviceName === "s3") {
    if (
      !req.body.access_credential.AWS_BUCKET_NAME ||
      !req.body.access_credential.AWS_BUCKET_REGION ||
      !req.body.access_credential.AWS_ACCESS_KEY ||
      !req.body.access_credential.AWS_SECRET_KEY
    ) {
      return {
        error: true,
        message: `Invalid credential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  if (provider.name === "Azure" && provider.serviceName === "blob-storage") {
    if (
      !req.body.access_credential.AZURE_STORAGE_CONNECTION_STRING ||
      !req.body.access_credential.AZURE_CONTAINER_NAME
    ) {
      return {
        error: true,
        message: `Invalid credential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  return { error: false, message: "" };
};
