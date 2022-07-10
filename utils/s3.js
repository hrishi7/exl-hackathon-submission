const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");

// uploads a file to s3
exports.uploadFileToS3 = async (file, crediential) => {
  const bucketName = crediential.AWS_BUCKET_NAME;
  const region = crediential.AWS_BUCKET_REGION;
  const accessKeyId = crediential.AWS_ACCESS_KEY;
  const secretAccessKey = crediential.AWS_SECRET_KEY;

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
exports.downloadFileFromS3 = async (fileKey, crediential) => {
  const bucketName = crediential.AWS_BUCKET_NAME;
  const region = crediential.AWS_BUCKET_REGION;
  const accessKeyId = crediential.AWS_ACCESS_KEY;
  const secretAccessKey = crediential.AWS_SECRET_KEY;
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
