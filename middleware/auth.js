/*const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// Check if user is authenticated or not
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);
  next();
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const { seller_token } = req.cookies;
  if (!seller_token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

  req.seller = await Shop.findById(decoded.id);

  next();
});

exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`${req.user.role} can not access this resources!`)
      );
    }
    next();
  };
};

// Why this auth?
// This auth is for the user to login and get the token
// This token will be used to access the protected routes like create, update, delete, etc. (autharization)*/

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// Check if user is authenticated or not
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      console.error('Authentication failed: No token provided');
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      console.error('Authentication failed: Token verification failed');
      return next(new ErrorHandler("Invalid token", 401));
    }

    req.user = await User.findById(decoded.id);
    if (!req.user) {
      console.error('Authentication failed: User not found');
      return next(new ErrorHandler("User not found", 404));
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const { seller_token } = req.cookies;
    if (!seller_token) {
      console.error('Seller authentication failed: No token provided');
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      console.error('Seller authentication failed: Token verification failed');
      return next(new ErrorHandler("Invalid token", 401));
    }

    req.seller = await Shop.findById(decoded.id);
    if (!req.seller) {
      console.error('Seller authentication failed: Shop not found');
      return next(new ErrorHandler("Shop not found", 404));
    }

    next();
  } catch (error) {
    console.error('Seller authentication error:', error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        console.error('Authorization failed: User not authenticated');
        return next(new ErrorHandler("User not authenticated", 401));
      }

      if (!roles.includes(req.user.role)) {
        console.error(`Authorization failed: ${req.user.role} does not have access`);
        return next(
          new ErrorHandler(`${req.user.role} cannot access this resource!`, 403)
        );
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return next(new ErrorHandler("Authorization failed", 403));
    }
  };
};

