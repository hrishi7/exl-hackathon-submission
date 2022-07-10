const Resource = require("../models/Resource");
const CloudCrediential = require("../models/CloudCrediential");
const TemporaryUrl = require("../models/TemporaryUrl");

const { uploadFileToS3, downloadFileFromS3 } = require("../utils/s3");

const {
  uploadDocumentToAzure,
  downloadDocumentFromAzure,
} = require("../utils/azure");

const { uploadToGCS, downloadFromGCS } = require("../utils/gcs");

const mongoose = require("mongoose");
const { unlinkFile } = require("../utils/fileUtils");

//@desc     Add Resource
//@route    Post /api/v1/resource/
//@access   Private
exports.addResource = async (payload) => {
  return await new Resource(payload).save();
};

//@desc     Delete Resource
//@route    DELETE /api/v1/resource/:id
//@access   Private
exports.deleteResource = async (id) => {
  await TemporaryUrl.findOneAndDelete({
    resource: mongoose.Types.ObjectId(id),
  });
  return await Resource.findOneAndDelete({ _id: mongoose.Types.ObjectId(id) });
};

//@desc     Get Resources
//@route    GET /api/v1/resource
//@access   Private
exports.getResources = async (req) => {
  let userId = req.user.id;
  let searchName = req.query.searchText ?? "";
  let query = { user: mongoose.Types.ObjectId(userId) };
  if (searchName)
    query["fileName"] = { $regex: new RegExp(searchName.trim(), "i") };
  let resources = await Resource.find(query).populate("cloudProvider");
  //TODO need to add temporary url list by aggregation
  return resources.map((resource) => ({
    ...resource._doc,
    downloadLink: `${process.env.API_SERVER_ENDPOINT}/api/v1/resource/download/${resource._doc.fileKey}?auth-token=REPLACE_YOUR_AUTH_TOKEN`,
  }));
};

//@desc     Get Resources
//@route    GET /api/v1/resource/:id
//@access   Private
exports.getResource = async (id) => {
  let resource = await Resource.findOne({
    _id: mongoose.Types.ObjectId(id),
  });
  //TODO need to add temporary url list by aggregation
  return {
    ...resource._doc,
    downloadLink: `${process.env.API_SERVER_ENDPOINT}/api/v1/resource/download/${resource.fileKey}?auth-token=REPLACE_YOUR_AUTH_TOKEN`,
  };
};

exports.uploadFileToCloud = async (req, res, next) => {
  try {
    // 1. first get the cloud provider crediential and provider info
    let cloudCreds = await CloudCrediential.findOne({
      user: mongoose.Types.ObjectId(req.user.id),
      cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
    }).populate("cloudProvider");

    // 2. call upload to specific provider with upload function and return required result
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Aws" &&
      cloudCreds.cloudProvider.serviceName === "s3"
    ) {
      const result = await uploadFileToS3(
        req.file,
        cloudCreds.access_crediential
      );
      if (!result)
        throw new Error(
          "Server Issue while uploading file to Cloud. Try again later"
        );
      req.payload = {
        fileName: req.file.originalname,
        fileKey: result.key,
        fileSizeInByte: req.file.size,
        user: req.user.id,
        cloudProvider: req.body.cloud_provider_id,
      };
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Azure" &&
      cloudCreds.cloudProvider.serviceName === "blob-storage"
    ) {
      let result = await uploadDocumentToAzure(
        req.file,
        cloudCreds.access_crediential
      );
      if (!result)
        throw new Error(
          "Server Issue while uploading file to Cloud. Try again later"
        );
      req.payload = {
        fileName: req.file.originalname,
        fileKey: result.key,
        fileSizeInByte: req.file.size,
        user: req.user.id,
        cloudProvider: req.body.cloud_provider_id,
      };
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Google" &&
      cloudCreds.cloudProvider.serviceName === "gcs"
    ) {
      let result = await uploadToGCS(req.file, cloudCreds.access_crediential);
      if (!result)
        throw new Error(
          "Server Issue while uploading file to Cloud. Try again later"
        );

      req.payload = {
        fileName: req.file.originalname,
        fileKey: result.key,
        fileSizeInByte: req.file.size,
        user: req.user.id,
        cloudProvider: req.body.cloud_provider_id,
      };
    }
    next();
  } catch (error) {
    console.log(error);
    res.json({
      status: 500,
      error: "Please check your cloud credientials or try again later",
    });
    return;
  } finally {
    await unlinkFile(req.file.path);
  }
};

exports.downloadResource = async (fileKey) => {
  try {
    let resource = await Resource.findOne({ fileKey: fileKey }).populate(
      "cloudProvider"
    );
    if (!resource) {
      return res.json({ status: 404, error: "Resource Not Found" });
    }

    let crediential = await CloudCrediential.findOne({
      user: mongoose.Types.ObjectId(resource.user),
      cloudProvider: mongoose.Types.ObjectId(resource.cloudProvider._id),
    });

    if (!crediential) {
      return res.json({ status: 404, error: "Cloud Crediential Not Found" });
    }

    if (
      resource &&
      resource.cloudProvider.name === "Aws" &&
      resource.cloudProvider.serviceName === "s3"
    ) {
      const readStream = await downloadFileFromS3(
        fileKey,
        crediential.access_crediential
      );
      if (!readStream) throw new Error();
      return { readStream, fileName: resource.fileName };
    }
    if (
      resource &&
      resource.cloudProvider.name === "Azure" &&
      resource.cloudProvider.serviceName === "blob-storage"
    ) {
      const readStream = await downloadDocumentFromAzure(
        fileKey,
        crediential.access_crediential
      );
      if (!readStream) throw new Error();
      return { readStream, fileName: resource.fileName };
    }
    if (
      resource &&
      resource.cloudProvider.name === "Google" &&
      resource.cloudProvider.serviceName === "gcs"
    ) {
      const readStream = await downloadFromGCS(
        fileKey,
        crediential.access_crediential
      );
      if (!readStream) throw new Error();
      return { readStream, fileName: resource.fileName };
    }
  } catch (error) {
    return null;
  }
};
