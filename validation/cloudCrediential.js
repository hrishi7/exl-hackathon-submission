const CloudCrediential = require("../models/CloudCrediential");
const CloudProvider = require("../models/CloudProvider");
const mongoose = require("mongoose");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

exports.validateCreateCrediential = async (req, res, next) => {
  if (!req.user) {
    return res.json({ status: 400, message: "User Not Found" });
  }
  if (!req.body.cloud_provider_id) {
    return res.json({
      status: 400,
      message: "Please Provide Cloud Provider id",
    });
  }
  if (!req.body.access_crediential) {
    return res.json({
      status: 400,
      message: "Please Provide Cloud Access Keys as Key:val pair",
    });
  }
  let provider = await CloudProvider.findOne({
    _id: mongoose.Types.ObjectId(req.body.cloud_provider_id),
  });
  if (!provider) {
    return res.json({ status: 400, message: "Cloud Provider Not Found" });
  }
  let valid = this.validCredformat(req, provider);
  if (valid.error)
    return res.json({
      status: 400,
      message: valid.message,
    });
  next();
};

exports.validateUpdateCrediential = async (req, res, next) => {
  if (!req.user) {
    return res.json({ status: 400, message: "User Not Found" });
  }
  if (!req.params.id) {
    return res.json({
      status: 400,
      message: "Please Provide crediential id to update",
    });
  }

  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.json({
      status: 404,
      message: "You are Not Authorized to Update",
    });
  }
  let cred = await CloudCrediential.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }).populate("cloudProvider");
  let provider = cred.cloudProvider;
  if (!provider) {
    return res.json({ status: 400, message: "Cloud Provider Not Found" });
  }
  let valid = this.validCredformat(req, provider);
  if (valid.error)
    return res.json({
      status: 400,
      message: valid.message,
    });
  next();
};

exports.validateDeleteCrediential = (req, res, next) => {
  if (!req.user) {
    res.json({ status: 400, message: "User Not Found" });
  }
  if (!req.params.id) {
    res.json({
      status: 400,
      message: "Please Provide crediential id to delete",
    });
  }
  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.json({
      status: 404,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validateFetchCrediential = (req, res, next) => {
  if (!req.user) {
    res.json({ status: 400, message: "User Not Found" });
  }
  if (!req.params.id) {
    res.json({
      status: 400,
      message: "Please Provide crediential id to delete",
    });
  }
  if (!this.foundCred(req.params.id, req.user.id)) {
    return res.json({
      status: 404,
      message: "You are Not Authorized to Update",
    });
  }
  next();
};

exports.validateHasCrediential = async (req, res, next) => {
  let existCrediential = await CloudCrediential.findOne({
    user: mongoose.Types.ObjectId(req.user.id),
    cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
  });
  if (!existCrediential) {
    res.json({
      status: 400,
      message:
        "Crediential Not Found For this Provider, Please add crediential first",
    });
    await unlinkFile(req.file.path);
    return;
  }
  next();
};

exports.foundCred = async (credientialId, userId) => {
  try {
    return (await CloudCrediential.findOne({
      _id: mongoose.Types.ObjectId(credientialId),
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
      !req.body.access_crediential.GCS_PROJECT_ID ||
      !req.body.access_crediential.GCS_BUCKET_NAME ||
      !req.body.access_crediential.GCS_KEYS_JSON
    ) {
      return {
        error: true,
        message: `Invalid crediential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  if (provider.name === "Aws" && provider.serviceName === "s3") {
    if (
      !req.body.access_crediential.AWS_BUCKET_NAME ||
      !req.body.access_crediential.AWS_BUCKET_REGION ||
      !req.body.access_crediential.AWS_ACCESS_KEY ||
      !req.body.access_crediential.AWS_SECRET_KEY
    ) {
      return {
        error: true,
        message: `Invalid crediential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  if (provider.name === "Azure" && provider.serviceName === "blob-storage") {
    if (
      !req.body.access_crediential.AZURE_STORAGE_CONNECTION_STRING ||
      !req.body.access_crediential.AZURE_CONTAINER_NAME
    ) {
      return {
        error: true,
        message: `Invalid crediential format , Please follow documentation for correct format for ${provider.name} - ${provider.serviceName}.`,
      };
    }
  }
  return { error: false, message: "" };
};
