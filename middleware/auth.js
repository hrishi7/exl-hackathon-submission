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

  //set token from cookie
  // else if(req.cookies.token){
  //     token = req.cookies.token;
  // }

  //Make sure token exists
  if (!token) {
    return res.json({
      message: "Not authorize to access this route",
      status: 401,
    });
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return res.json({
      message: "Not authorize to access this route",
      status: 401,
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
    return res.json({
      message:
        "Not authorize to access this route. Please make sure to pass auth-token as query parameter",
      status: 401,
    });
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    return res.json({
      message: "Not authorize to access this route",
      status: 401,
    });
  }
});
