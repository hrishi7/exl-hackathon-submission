const mongoose = require("mongoose");

const TemporaryUrlSchema = mongoose.Schema({
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: "Resource",
    required: true,
  },
  urlSlug: {
    type: String,
    required: [true, "Please add urlSlug"],
  },
  sharedOn: {
    type: Date,
    default: Date.now,
  },
  expiresIn: {
    type: Number,
    default: 0,
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

module.exports = mongoose.model("TemporaryUrl", TemporaryUrlSchema);
