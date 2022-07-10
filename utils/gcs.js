const Cloud = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");
const { Storage } = Cloud;
const { unlinkFile } = require("./fileUtils");

/**
 * Middleware for uploading file to GCS.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {*}
 */
exports.uploadToGCS = async (file, crediential) => {
  const keysFilePath = path.join(
    __dirname,
    `./google-keys/keys_${crediential.GCS_PROJECT_ID}.json`
  );
  let data = JSON.stringify(crediential.GCS_KEYS_JSON);
  fs.writeFileSync(keysFilePath, data);
  const gcsStorage = new Storage({
    keyFilename: keysFilePath,
    projectId: crediential.GCS_PROJECT_ID,
  });

  const bucket = gcsStorage.bucket(crediential.GCS_BUCKET_NAME);
  const uploadedFile = bucket.file(file.filename);
  try {
    await bucket.upload(file.path, {});
    await uploadedFile.makePrivate();
    return { key: file.filename };
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await unlinkFile(keysFilePath);
  }
};

exports.downloadFromGCS = async (fileKey, crediential) => {
  try {
    const keysFilePath = path.join(
      __dirname,
      `./google-keys/keys_${crediential.GCS_PROJECT_ID}.json`
    );
    const gcsStorage = new Storage({
      keyFilename: keysFilePath,
      projectId: process.env.GCS_PROJECT_ID,
    });
    const bucket = gcsStorage.bucket(process.env.GCS_BUCKET_NAME);
    return bucket.file(fileKey).createReadStream();
  } catch (error) {
    return null;
  } finally {
    await unlinkFile(keysFilePath);
  }
};
