const mongoose = require("mongoose");

const cloudProviderSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  serviceName :{
    type: String, //TODO make it enum with all possible providers service names
    required: [true, "Please add a service name"]
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

module.exports = mongoose.model("CloudProvider", cloudProviderSchema);
