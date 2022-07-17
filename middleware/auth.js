const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const User = require("../models/User");

//Protect route
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  //set token from bearer token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  //Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }
});

//check if user is owner of the requested resource

exports.checkQueryToken = asyncHandler(async (req, res, next) => {
  let token;
  if (req.query && req.query["auth-token"]) {
    token = req.query["auth-token"].trim();
  }

  //Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Not authorize to access this route. Please make sure to pass auth-token as query parameter",
    });
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }
});
