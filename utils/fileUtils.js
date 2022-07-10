const util = require("util");
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

exports.unlinkFile = util.promisify(fs.unlink);

exports.compressFile = async (req, res, next) => {
  try {
    const destination = `../compressed/${req.file.filename}`;
    const buffer = fs.readFileSync(req.file.path);
    zlib.gzip(buffer, async (err, response) => {
      if (err) {
        throw new Error();
      } else {
        fs.appendFile(
          path.join(__dirname, destination),
          response,
          async (err, data) => {
            if (err) {
              throw new Error();
            } else {
              await this.unlinkFile(req.file.path);
              req.file = {
                ...req.file,
                path: `compressed/${req.file.filename}`,
                size: Buffer.byteLength(response),
              };
              next();
            }
          }
        );
      }
    });
  } catch (error) {
    console.log(error);
    // if somhow compression failed then upload original one
    next();
  }
};
