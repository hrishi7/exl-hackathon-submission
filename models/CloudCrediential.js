const mongoose = require("mongoose");

const cloudCredientialSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  cloudProvider: {
    type: mongoose.Schema.ObjectId,
    ref: "CloudProvider",
  },
  access_crediential :{
    type: {}, // store all key: val in encrypted format
    required: [true, "Please add a credientials info"]
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

module.exports = mongoose.model("CloudCrediential", cloudCredientialSchema);
