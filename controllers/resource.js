const Resource = require("../models/Resource");
const CloudCredential = require("../models/CloudCredential");
const TemporaryUrl = require("../models/TemporaryUrl");

const {
  uploadFileToS3,
  downloadFileFromS3,
  deleteFileFromS3,
} = require("../utils/s3");

const {
  uploadDocumentToAzure,
  downloadDocumentFromAzure,
  deleteDocumentFromAzure,
} = require("../utils/azure");

const { uploadToGCS, downloadFromGCS, deleteFromGCS } = require("../utils/gcs");
const { getDecryptedData } = require("../controllers/cloudCredential");

const mongoose = require("mongoose");
const { unlinkFile } = require("../utils/fileUtils");

//@desc     Add Resource
//@route    Post /api/v1/resource/
//@access   Private
exports.addResource = async (payload) => {
  return await new Resource(payload).save();
};

exports.addMultipleResource = async (payloads) => {
  return await Resource.insertMany(payloads);
};

//@desc     Delete Resource
//@route    DELETE /api/v1/resource/:id
//@access   Private
exports.deleteResource = async (userId, id) => {
  try {
    //1st remove from cloud storage successfully then
    let resource = await Resource.findOne({ _id: mongoose.Types.ObjectId(id) });

    let cloudCreds = await await CloudCredential.findOne({
      user: mongoose.Types.ObjectId(userId),
      cloudProvider: mongoose.Types.ObjectId(resource.cloudProvider),
    }).populate("cloudProvider");

    cloudCreds = {
      ...cloudCreds._doc,
      access_credential: getDecryptedData(cloudCreds),
    };

    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Aws" &&
      cloudCreds.cloudProvider.serviceName === "s3"
    ) {
      const result = await deleteFileFromS3(
        resource.fileKey,
        cloudCreds.access_credential
      );
      if (!result)
        throw new Error(
          "Server Issue while deleting file from Cloud. Try again later"
        );
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Azure" &&
      cloudCreds.cloudProvider.serviceName === "blob-storage"
    ) {
      let result = await deleteDocumentFromAzure(
        resource.fileKey,
        cloudCreds.access_credential
      );
      if (!result)
        throw new Error(
          "Server Issue while deleting file from Cloud. Try again later"
        );
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Google" &&
      cloudCreds.cloudProvider.serviceName === "gcs"
    ) {
      let result = await deleteFromGCS(
        resource.fileKey,
        cloudCreds.access_credential
      );
      if (!result)
        throw new Error(
          "Server Issue while deleting file from Cloud. Try again later"
        );
    }

    //remove temporary url linked to resource
    await TemporaryUrl.findOneAndDelete({
      resource: mongoose.Types.ObjectId(id),
    });
    // then remove the resource entry from db
    return await Resource.findOneAndDelete({
      _id: mongoose.Types.ObjectId(id),
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Please check your cloud credentials or try again later",
    });
  }
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
    // 1. first get the cloud provider credential and provider info
    let cloudCreds = await CloudCredential.findOne({
      user: mongoose.Types.ObjectId(req.user.id),
      cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
    }).populate("cloudProvider");

    cloudCreds = {
      ...cloudCreds._doc,
      access_credential: getDecryptedData(cloudCreds),
    };

    // 2. call upload to specific provider with upload function and return required result
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Aws" &&
      cloudCreds.cloudProvider.serviceName === "s3"
    ) {
      const result = await uploadFileToS3(
        req.file,
        cloudCreds.access_credential
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
        cloudCreds.access_credential
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
      let result = await uploadToGCS(req.file, cloudCreds.access_credential);
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
    return res.status(400).json({
      success: false,
      message: "Please check your cloud credentials or try again later",
    });
  } finally {
    await unlinkFile(req.file.path);
  }
};

exports.uploadMultipleFileToCloud = async (req, res, next) => {
  try {
    // 1. first get the cloud provider credential and provider info
    let cloudCreds = await CloudCredential.findOne({
      user: mongoose.Types.ObjectId(req.user.id),
      cloudProvider: mongoose.Types.ObjectId(req.body.cloud_provider_id),
    }).populate("cloudProvider");

    cloudCreds = {
      ...cloudCreds._doc,
      access_credential: getDecryptedData(cloudCreds),
    };

    // 2. call upload to specific provider with upload function and return required result
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Aws" &&
      cloudCreds.cloudProvider.serviceName === "s3"
    ) {
      req.payloads = [];
      for (const file of req.files) {
        const result = await uploadFileToS3(file, cloudCreds.access_credential);
        if (!result)
          throw new Error(
            "Server Issue while uploading file to Cloud. Try again later"
          );
        req.payloads.push({
          fileName: file.originalname,
          fileKey: result.key,
          fileSizeInByte: file.size,
          user: req.user.id,
          cloudProvider: req.body.cloud_provider_id,
        });
      }
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Azure" &&
      cloudCreds.cloudProvider.serviceName === "blob-storage"
    ) {
      req.payloads = [];
      for (const file of req.files) {
        const result = await uploadDocumentToAzure(
          file,
          cloudCreds.access_credential
        );
        if (!result)
          throw new Error(
            "Server Issue while uploading file to Cloud. Try again later"
          );
        req.payloads.push({
          fileName: file.originalname,
          fileKey: result.key,
          fileSizeInByte: file.size,
          user: req.user.id,
          cloudProvider: req.body.cloud_provider_id,
        });
      }
    }
    if (
      cloudCreds &&
      cloudCreds.cloudProvider.name === "Google" &&
      cloudCreds.cloudProvider.serviceName === "gcs"
    ) {
      req.payloads = [];
      for (const file of req.files) {
        const result = await uploadToGCS(file, cloudCreds.access_credential);
        if (!result)
          throw new Error(
            "Server Issue while uploading file to Cloud. Try again later"
          );
        req.payloads.push({
          fileName: file.originalname,
          fileKey: result.key,
          fileSizeInByte: file.size,
          user: req.user.id,
          cloudProvider: req.body.cloud_provider_id,
        });
      }
    }
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Please check your cloud credentials or try again later",
    });
  } finally {
    for (const file of req.files) {
      await unlinkFile(file.path);
    }
  }
};

exports.downloadResource = async (fileKey) => {
  try {
    let resource = await Resource.findOne({ fileKey: fileKey }).populate(
      "cloudProvider"
    );
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource Not Found" });
    }

    let credential = await CloudCredential.findOne({
      user: mongoose.Types.ObjectId(resource.user),
      cloudProvider: mongoose.Types.ObjectId(resource.cloudProvider._id),
    });
    credential = {
      ...credential._doc,
      access_credential: getDecryptedData(credential),
    };

    if (!credential) {
      return res
        .status(404)
        .json({ success: false, message: "Cloud Credential Not Found" });
    }

    if (
      resource &&
      resource.cloudProvider.name === "Aws" &&
      resource.cloudProvider.serviceName === "s3"
    ) {
      const readStream = await downloadFileFromS3(
        fileKey,
        credential.access_credential
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
        credential.access_credential
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
        credential.access_credential
      );
      if (!readStream) throw new Error();
      return { readStream, fileName: resource.fileName };
    }
  } catch (error) {
    return null;
  }
};
