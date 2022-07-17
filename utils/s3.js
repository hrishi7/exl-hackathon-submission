const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");

// uploads a file to s3
exports.uploadFileToS3 = async (file, credential) => {
  const bucketName = credential.AWS_BUCKET_NAME;
  const region = credential.AWS_BUCKET_REGION;
  const accessKeyId = credential.AWS_ACCESS_KEY;
  const secretAccessKey = credential.AWS_SECRET_KEY;

  const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey,
  });
  try {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename,
    };

    await s3.upload(uploadParams).promise();
    return { key: file.filename };
  } catch (error) {
    console.log(error);
    return null;
  }
};

// downloads a file from s3
exports.downloadFileFromS3 = async (fileKey, credential) => {
  const bucketName = credential.AWS_BUCKET_NAME;
  const region = credential.AWS_BUCKET_REGION;
  const accessKeyId = credential.AWS_ACCESS_KEY;
  const secretAccessKey = credential.AWS_SECRET_KEY;
  try {
    const s3 = new S3({
      region,
      accessKeyId,
      secretAccessKey,
    });
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName,
    };

    return s3.getObject(downloadParams).createReadStream();
  } catch (error) {
    return null;
  }
};

// delete a file from s3
exports.deleteFileFromS3 = async (fileKey, credential) => {
  const bucketName = credential.AWS_BUCKET_NAME;
  const region = credential.AWS_BUCKET_REGION;
  const accessKeyId = credential.AWS_ACCESS_KEY;
  const secretAccessKey = credential.AWS_SECRET_KEY;
  try {
    const s3 = new S3({
      region,
      accessKeyId,
      secretAccessKey,
    });
    let params = {
      Bucket: bucketName,
      Key: fileKey,
    };
    await s3.headObject(params).promise();
    console.log("File Found in S3");
    try {
      await s3.deleteObject(params).promise();
      console.log("file deleted Successfully");
      return true;
    } catch (err) {
      console.log("ERROR in file Deleting : " + JSON.stringify(err));
      return false;
    }
  } catch (err) {
    console.log("File not Found ERROR : " + err.code);
    return false;
  }
};
