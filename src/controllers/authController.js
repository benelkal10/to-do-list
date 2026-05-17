const User = require('../models/User');
const { generateToken } = require('../services/authService');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new ErrorResponse('Please provide username and password', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  const userExists = await User.findOne({ username });

  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  const user = await User.create({
    username,
    password,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      token: generateToken(user._id),
    }
  });
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new ErrorResponse('Please provide username and password', 400));
  }

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        token: generateToken(user._id),
      }
    });
  } else {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
});

module.exports = { registerUser, loginUser };
