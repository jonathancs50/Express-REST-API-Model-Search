//inherit from the Error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Executes the parent constructor which sets message
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
