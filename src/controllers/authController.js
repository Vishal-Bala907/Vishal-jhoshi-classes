const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  success,
  created,
  badRequest,
  internalServerError,
} = require("../helpers/responseType/index.js");
const User = require("../models/User");

exports.signUpController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json(badRequest([errors.array()]));
  }

  const { email, password, name } = req.body;

  console.log(req.body);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json(badRequest([{ message: "User already exists" }]));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    res.json(created({ message: "User created successfully" }));
  } catch (error) {
    res.json(internalServerError([error]));
  }
};

exports.signInController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json(badRequest([errors.array()]));
  }

  const { email, password } = req.body;
  console.log(req.body);

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json(badRequest([{ message: "Invalid email or password" }]));
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.json(success({ token, user }));
  } catch (error) {
    res.json(internalServerError([error]));
  }
};

exports.forgetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json(badRequest([errors.array()]));
  }

  const { email, pin } = req.body;

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });

  res.json(success({ token }));
};

exports.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json(badRequest([errors.array()]));
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json(badRequest([{ message: "User not found." }]));
    }

    // Check if the new password is different from the old one
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.json(badRequest([{ message: "Password must be new." }]));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    res.json(success({ message: "Password updated successfully." }));
  } catch (error) {
    res.json(internalServerError([error.message || error]));
  }
};
