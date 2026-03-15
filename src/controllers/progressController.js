const Progress = require("../models/Progress");


// Add or Update Member Progress
const addProgress = async (req, res) => {

    try {

        const { weight, height } = req.body;

        if (!weight || !height) {
            return res.status(400).json({ message: "Please provide weight and height" });
        }

        const heightInMeters = height / 100;

        const bmi = parseFloat(
            (weight / (heightInMeters * heightInMeters)).toFixed(2)
        );

        // Check if member already has progress
        let progress = await Progress.findOne({ member: req.user.id });

        if (progress) {

            progress.weight = weight;
            progress.height = height;
            progress.bmi = bmi;
            progress.date = new Date();

            await progress.save();

        } else {

            progress = await Progress.create({
                member: req.user.id,
                weight,
                height,
                bmi,
                date: new Date()
            });

        }

        res.status(200).json(progress);

    } catch (err) {

        res.status(500).json({
            message: "Error adding progress",
            error: err.message
        });

    }

};


// Get Logged Member Progress History
const getProgressHistory = async (req, res) => {

    try {

        const history = await Progress
            .find({ member: req.user.id })
            .sort({ date: 1 });

        res.json(history);

    } catch (err) {

        res.status(500).json({
            message: "Error fetching progress",
            error: err.message
        });

    }

};


// Trainer → Get All Members Progress
const getAllMembersProgress = async (req, res) => {

    try {

        const progress = await Progress
            .find()
            .populate("member", "name email")
            .sort({ date: -1 });

        res.json(progress);

    } catch (err) {

        res.status(500).json({
            message: "Error fetching members progress",
            error: err.message
        });

    }

};


module.exports = {
    addProgress,
    getProgressHistory,
    getAllMembersProgress
};
