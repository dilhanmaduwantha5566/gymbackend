const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const classRoutes = require("./src/routes/classRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes"); // <-- Added
const planRoutes = require("./src/routes/planRoutes");

const app = express();

let isMongoConnected = false;

const connectToDatabase = async () => {
  if (isMongoConnected) {
    return;
  }

  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  isMongoConnected = true;
  console.log("MongoDB Connected");
};

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Allow Vercel frontend
    credentials: true,
  })
);

// Ensure DB connection before handling API requests in serverless runtime
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(500).json({ message: "Database connection error" });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/feedback", feedbackRoutes); // <-- Feedback route added
app.use("/api/plans", planRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Supreme Fitness Gym API is running");
});

// Local server startup entrypoint
if (require.main === module) {
  const PORT = process.env.PORT || 5002;

  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err);
      process.exit(1);
    });
}

module.exports = app;