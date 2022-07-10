const Multer = require("multer");

multerConfiguration = Multer({
  limits: {
    fileSize: 1024 * 1024 * 1024, // Maximum file size is 1GB
  },
  //TODO allow only word doc extension and image type extention
  dest: "uploads/",
});

module.exports = multerConfiguration;
