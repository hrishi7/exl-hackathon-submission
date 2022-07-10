const { BlobServiceClient } = require("@azure/storage-blob");

exports.uploadDocumentToAzure = async (file, crediential) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    crediential.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(
    crediential.AZURE_CONTAINER_NAME
  );
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(file.filename);
    await blockBlobClient.uploadFile(file.path, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });
    return { key: blockBlobClient.name };
  } catch (error) {
    return null;
  }
};

exports.downloadDocumentFromAzure = async (fileKey, crediential) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      crediential.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(
      crediential.AZURE_CONTAINER_NAME
    );
    const blobClient = containerClient.getBlockBlobClient(fileKey);
    const downloadBlockBlobResponse = await blobClient.download();
    return downloadBlockBlobResponse.readableStreamBody;
  } catch (error) {
    return null;
  }
};

async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      return Buffer.concat(chunks);
    });
    readableStream.on("error", reject);
  });
}
