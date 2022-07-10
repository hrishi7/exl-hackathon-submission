const CloudProvider = require("../models/CloudProvider");
const mongoose = require("mongoose");

exports.addProviders = async () => {
  const pList = [
    {
      name: "Google",
      serviceName: "gcs",
    },
    {
      name: "Aws",
      serviceName: "s3",
    },
    { name: "Azure", serviceName: "blob-storage" },
  ];
  pList.map(async (p) => {
    if (
      !(await CloudProvider.findOne({
        name: p.name,
        serviceName: p.serviceName,
      }))
    )
      return await new CloudProvider(p).save();
  });
};
//@desc     Get list of supported providers
//@route    Get /api/v1/cloud-provider
//@access   Public
exports.getSupportedProviders = async () => {
  const providers = await CloudProvider.find();
  return providers;
};

//@desc     Get provider info
//@route    Get /api/v1/cloud-provider/:id
//@access   Public
exports.getProvider = async (id) => {
  const provider = await CloudProvider.findOne({
    _id: mongoose.Types.ObjectId(id),
  });
  return provider;
};
