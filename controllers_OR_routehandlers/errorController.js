const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const keyValue = Object.values(err.keyValue)[0];
  const message = `Duplicate field value:${keyValue}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidatoinErrorDB = (err) => {
  console.log("hello");
  console.log(err);
  const errorArray = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errorArray.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError("Invalid token. Please login again", 401);

const handleJWTExpiredError = () =>
  new AppError("Token has expired. Please login again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or other unknown error: dont want to leak the details to the client
  } else {
    //1) Log error
    console.error("***ERROR***", err);
    //2)send a generic error
    res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
};

// error handling middleware
exports.globalErrorHandler = (err, req, res, next) => {
  // Set a default status code if one is not set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidatoinErrorDB(err);

    if (err.name === "JsonWebTokenError") error = handleJWTError(err);
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
