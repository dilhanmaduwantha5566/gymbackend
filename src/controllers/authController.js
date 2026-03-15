const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Admin = require("../models/Admin");
const Member = require("../models/Member");
const Trainer = require("../models/Trainer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ------------------------
// REGISTER (Members/Trainers Only)
// ------------------------
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check for valid role
    if (!["member", "trainer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user already exists
    let existingUser;
    if (role === "member") existingUser = await Member.findOne({ email });
    else existingUser = await Trainer.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: `${role} already exists` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Create or Update user
    let user;

    if (existingUser) {
      // Update unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new user
      if (role === "member") {
        user = await Member.create({
          name,
          email,
          password: hashedPassword,
          isApproved: false, // admin approval required
          verificationCode,
          verificationCodeExpires,
        });
      } else {
        user = await Trainer.create({
          name,
          email,
          password: hashedPassword,
          isApproved: false, // admin approval required
          verificationCode,
          verificationCodeExpires,
        });
      }
    }

    // Send verification email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - Supreme Fitness Gym",
      html: `
        <h2>Welcome to Supreme Fitness Gym!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #dc2626; letter-spacing: 5px;">${verificationCode}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>Please enter this code on the verification page to activate your account.</p>
      `,
    });

    res.status(201).json({ message: `${role} registered successfully. Please check your email for the verification code.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// LOGIN (Admin, Member, Trainer)
// ------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await Admin.findOne({ email });
    let role = "admin";

    if (!user) {
      user = await Member.findOne({ email });
      role = "member";
    }
    if (!user) {
      user = await Trainer.findOne({ email });
      role = "trainer";
    }

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Members/Trainers must be approved and verified
    if (role !== "admin") {
      if (!user.isVerified) {
        return res.status(403).json({ message: "Please verify your email first." });
      }
      if (!user.isApproved) {
        return res.status(403).json({ message: "Waiting for admin approval" });
      }
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// VERIFY EMAIL
// ------------------------
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Check Member
    let user = await Member.findOne({ email });
    let role = "member";

    // Check Trainer if not found
    if (!user) {
      user = await Trainer.findOne({ email });
      role = "trainer";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Verification code expired" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now login pending admin approval." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// GET CURRENT USER
// ------------------------
const getMe = async (req, res) => {
  try {
    let user;

    if (req.user.role === "admin") user = await Admin.findById(req.user.id).select("-password");
    else if (req.user.role === "member") user = await Member.findById(req.user.id).select("-password");
    else if (req.user.role === "trainer") user = await Trainer.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// FORGOT PASSWORD
// ------------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    let user = await Member.findOne({ email });
    let role = "member";

    if (!user) {
      user = await Trainer.findOne({ email });
      role = "trainer";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Save reset code to user (using verificationCode fields for simplicity)
    user.verificationCode = resetCode;
    user.verificationCodeExpires = resetCodeExpires;
    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - Supreme Fitness Gym",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Your code is:</p>
        <h1 style="color: #dc2626; letter-spacing: 5px;">${resetCode}</h1>
        <p>This code will expire in 5 minutes.</p>
      `,
    });

    res.json({ message: "Password reset code sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// RESET PASSWORD
// ------------------------
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    let user = await Member.findOne({ email });
    if (!user) {
      user = await Trainer.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Code expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------
// UPDATE PROFILE
// ------------------------
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    let user;
    if (role === "admin") user = await Admin.findById(userId);
    else if (role === "member") user = await Member.findById(userId);
    else if (role === "trainer") user = await Trainer.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    // NOTE: Email update is disabled as per user request
    // if (email) user.email = email; 
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ message: "Profile updated successfully", user: { name: user.name, email: user.email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { register, login, getMe, verifyEmail, forgotPassword, resetPassword, updateProfile };
