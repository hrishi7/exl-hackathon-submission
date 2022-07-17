const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.ENCRIPTION_SECERT);

exports.encrypt = (plainString) => {
  return !plainString ? "" : cryptr.encrypt(plainString);
};

exports.decrypt = (encryptedString) => {
  return !encryptedString ? "" : cryptr.decrypt(encryptedString);
};
