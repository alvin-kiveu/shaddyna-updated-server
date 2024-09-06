/*class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ErrorHandler;*/

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Log the error details to the console
    console.error(`Error: ${message}`);
    console.error(this.stack);

    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ErrorHandler;

