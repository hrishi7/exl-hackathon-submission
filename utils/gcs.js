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
exports.uploadToGCS = async (file, credential) => {
  const keysFilePath = path.join(
    __dirname,
    `./google-keys/keys_${credential.GCS_PROJECT_ID}.json`
  );
  let data = JSON.stringify(credential.GCS_KEYS_JSON);
  fs.writeFileSync(keysFilePath, data);
  const gcsStorage = new Storage({
    keyFilename: keysFilePath,
    projectId: credential.GCS_PROJECT_ID,
  });

  const bucket = gcsStorage.bucket(credential.GCS_BUCKET_NAME);
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

exports.downloadFromGCS = async (fileKey, credential) => {
  try {
    const keysFilePath = path.join(
      __dirname,
      `./google-keys/keys_${credential.GCS_PROJECT_ID}.json`
    );
    let data = JSON.stringify(credential.GCS_KEYS_JSON);
    fs.writeFileSync(keysFilePath, data);
    const gcsStorage = new Storage({
      keyFilename: keysFilePath,
      projectId: credential.GCS_PROJECT_ID,
    });
    const bucket = gcsStorage.bucket(credential.GCS_BUCKET_NAME);
    return bucket.file(fileKey).createReadStream();
  } catch (error) {
    return null;
  } finally {
    await unlinkFile(keysFilePath);
  }
};

exports.deleteFromGCS = async (fileKey, credential) => {
  try {
    const keysFilePath = path.join(
      __dirname,
      `./google-keys/keys_${credential.GCS_PROJECT_ID}.json`
    );
    let data = JSON.stringify(credential.GCS_KEYS_JSON);
    fs.writeFileSync(keysFilePath, data);
    const gcsStorage = new Storage({
      keyFilename: keysFilePath,
      projectId: credential.GCS_PROJECT_ID,
    });
    const bucket = gcsStorage.bucket(credential.GCS_BUCKET_NAME);
    await bucket.file(fileKey).delete();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  } finally {
    await unlinkFile(keysFilePath);
  }
};
