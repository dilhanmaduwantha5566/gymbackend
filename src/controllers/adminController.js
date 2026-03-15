const Member = require("../models/Member");
const Trainer = require("../models/Trainer");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

// Get all pending members and trainers (Verified but Not Approved)
const getPendingUsers = async (req, res) => {
  try {
    const members = await Member.find({ isApproved: false, isVerified: true }).select("-password");
    const trainers = await Trainer.find({ isApproved: false, isVerified: true }).select("-password");

    res.json({ members, trainers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all approved members and trainers
const getApprovedUsers = async (req, res) => {
  try {
    const members = await Member.find({ isApproved: true }).select("-password");
    const trainers = await Trainer.find({ isApproved: true }).select("-password");

    res.json({ members, trainers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve member or trainer
const approveUser = async (req, res) => {
  try {
    const { role, id } = req.params;

    if (role !== "member" && role !== "trainer")
      return res.status(400).json({ message: "Invalid role" });

    let user;
    if (role === "member") user = await Member.findById(id);
    else user = await Trainer.findById(id);

    if (!user) return res.status(404).json({ message: `${role} not found` });

    user.isApproved = true;
    await user.save();

    res.json({ message: `${role} approved successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject (Delete) member or trainer
const rejectUser = async (req, res) => {
  try {
    const { role, id } = req.params;

    if (role !== "member" && role !== "trainer")
      return res.status(400).json({ message: "Invalid role" });

    let user;
    if (role === "member") user = await Member.findByIdAndDelete(id);
    else user = await Trainer.findByIdAndDelete(id);

    if (!user) return res.status(404).json({ message: `${role} not found` });

    res.json({ message: `${role} rejected (deleted) successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Deactivate member or trainer (instead of delete)
const deactivateUser = async (req, res) => {
  try {
    const { role, id } = req.params;

    if (role !== "member" && role !== "trainer")
      return res.status(400).json({ message: "Invalid role" });

    let user;
    // We toggle isApproved false to "deactivate" them, or we could add an isActive field. 
    // For now, let's treat "deactivate" as revoking approval.
    if (role === "member") user = await Member.findById(id);
    else user = await Trainer.findById(id);

    if (!user) return res.status(404).json({ message: `${role} not found` });

    user.isApproved = false;
    await user.save();

    res.json({ message: `${role} deactivated successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all payments (Bookings)
const getAllPayments = async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    const payments = await Booking.find()
      .populate("member", "name email")
      .populate("classId", "name price date time")
      .sort({ createdAt: -1 });

    const validPayments = [];
    const orphanedIds = [];

    for (const p of payments) {
      if (!p.member) {
        orphanedIds.push(p._id);
      } else {
        validPayments.push(p);
      }
    }

    // Automatically delete orphaned payments from the database
    if (orphanedIds.length > 0) {
      await Booking.deleteMany({ _id: { $in: orphanedIds } });
    }

    res.json(validPayments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching payments" });
  }
};

// Get System Reports
const getReports = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const last6Months = new Date(today);
    last6Months.setMonth(today.getMonth() - 6);

    // 1. Total Revenue
    const totalRevenueResult = await require("../models/Booking").aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: "$paymentAmount" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // 2. Active Bookings (Confirmed)
    const activeCheckins = await require("../models/Booking").countDocuments({ status: 'confirmed' });

    // 3. New Signups (Last 30 days)
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const newSignups = await require("../models/Member").countDocuments({ createdAt: { $gte: last30Days } });

    // 4. Attendance Chart (Last 7 Days)
    const attendanceData = await require("../models/Booking").aggregate([
      { $match: { createdAt: { $gte: lastWeek }, status: 'confirmed' } },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Mongo dayOfWeek: 1=Sun, 2=Mon ... 7=Sat
    // We want data for [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const daysMap = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 }; // Map Mongo ID to Array Index
    const attendanceChartData = Array(7).fill(0);
    attendanceData.forEach(item => {
      const index = daysMap[item._id];
      if (index !== undefined) attendanceChartData[index] = item.count;
    });

    // 5. Revenue Chart (Last 6 Months)
    const revenueData = await require("../models/Booking").aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: "$paymentAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueChartLabels = [];
    const revenueChartValues = [];

    revenueData.forEach(item => {
      revenueChartLabels.push(monthNames[item._id.month - 1]);
      revenueChartValues.push(item.total);
    });

    res.json({
      stats: {
        totalRevenue,
        activeCheckins,
        newSignups
      },
      charts: {
        attendance: attendanceChartData,
        revenue: { labels: revenueChartLabels, data: revenueChartValues }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching reports" });
  }
};

// Update Admin Profile
const updateAdminProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (name) admin.name = name;
    await admin.save();
    res.json({ message: "Profile updated successfully", name: admin.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// Update Admin Password
const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating password" });
  }
};

module.exports = { getPendingUsers, approveUser, getApprovedUsers, rejectUser, deactivateUser, getAllPayments, getReports, updateAdminProfile, updateAdminPassword };
