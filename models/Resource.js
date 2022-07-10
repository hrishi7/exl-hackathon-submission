const mongoose = require("mongoose");

const ResourceSchema = mongoose.Schema({
  fileName: {
    type: String,
    required: [true, "Please add a fileName"],
  },
  fileKey: {
    type: String,
    required: [true, "Please add an File Key"],
  },
  fileSizeInByte: { type: Number },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  cloudProvider: {
    type: mongoose.Schema.ObjectId,
    ref: "CloudProvider",
    required: true,
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

module.exports = mongoose.model("Resource", ResourceSchema);
