const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const catchAsync = require('../../utils/catchAsync');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    return next(error);
  }

  const newUser = await User.create({
    username,
    email,
    password,
  });

  createSendToken(newUser, 201, res);
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    return next(error);
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    const error = new Error('Incorrect email or password');
    error.statusCode = 401;
    return next(error);
  }

  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
};

const getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
};

module.exports = {
  signup,
  login,
  getMe,
};
