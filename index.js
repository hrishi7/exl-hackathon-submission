//base pacakges import
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

//Load env vars
dotenv.config({ path: "./config/config.env" });

colors.enable();

//Route files
const auth = require("./routes/auth");
const resource = require("./routes/resource");
const cloudProvider = require("./routes/cloudProvider");
const cloudCredential = require("./routes/cloudCredential");
const temporaryUrl = require("./routes/temporaryUrl");

//connect to database
connectDB();

const app = express();

//body parser
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// //set secuirity headers
app.use(helmet());

// //rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
});
app.use(limiter);

// //prevent http param pollution
app.use(hpp());

//Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/health-check", (req, res) =>
  res.status(200).json({
    message: "Health OK",
    apiDocUrl: process.env.API_DOC_URL,
  })
);

//Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/resource", resource);
app.use("/api/v1/cloud-provider", cloudProvider);
app.use("/api/v1/cloud-credential", cloudCredential);
app.use("/api/v1/temporary-url", temporaryUrl);

app.use("/*", (req, res) => {
  res.status(200).json({
    message: `Route Not found`,
    apiDocUrl: process.env.API_DOC_URL,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server Running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

//Handle unhandled promise rejection
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //close server & exit process
  server.close(() => process.exit(1));
});
