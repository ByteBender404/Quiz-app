const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../modules/user/user.model');

const protect = async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const error = new Error('You are not logged in! Please log in to get access.');
    error.statusCode = 401;
    return next(error);
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    const error = new Error('The user belonging to this token does no longer exist.');
    error.statusCode = 401;
    return next(error);
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'user']. role='user'
    if (!roles.includes(req.user.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
