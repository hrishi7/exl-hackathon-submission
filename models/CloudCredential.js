const mongoose = require("mongoose");

const cloudCredentialSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  cloudProvider: {
    type: mongoose.Schema.ObjectId,
    ref: "CloudProvider",
  },
  access_credential: {
    type: String,
    required: [true, "Please add a credentials info"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("CloudCredential", cloudCredentialSchema);
