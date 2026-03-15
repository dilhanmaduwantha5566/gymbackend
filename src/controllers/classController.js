const Class = require("../models/Class");

// Create a new class (Trainer only)
const createClass = async (req, res) => {
    try {
        const { name, type, date, time, duration, price } = req.body;
        const newClass = new Class({
            name,
            type,
            date,
            time,
            duration,
            price,
            trainer: req.user.id
        });
        await newClass.save();
        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ message: "Error creating class", error: err.message });
    }
};

// Get all classes (For browsing)
const getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find().populate("trainer", "name");
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: "Error fetching classes", error: err.message });
    }
};

// Get classes for a specific trainer
const getTrainerClasses = async (req, res) => {
    try {
        const classes = await Class.find({ trainer: req.user.id });
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: "Error fetching trainer classes", error: err.message });
    }
};

// Update a class
const updateClass = async (req, res) => {
    try {
        const { name, type, date, time, duration, price } = req.body;
        const currentClass = await Class.findById(req.params.id);

        if (!currentClass) return res.status(404).json({ message: "Class not found" });

        // Verify that the person updating it is the trainer who created it
        if (currentClass.trainer.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this class" });
        }

        currentClass.name = name || currentClass.name;
        currentClass.type = type || currentClass.type;
        currentClass.date = date || currentClass.date;
        currentClass.time = time || currentClass.time;
        currentClass.duration = duration || currentClass.duration;
        currentClass.price = price !== undefined ? price : currentClass.price;

        await currentClass.save();

        res.json(currentClass);
    } catch (err) {
        res.status(500).json({ message: "Error updating class", error: err.message });
    }
};

module.exports = { createClass, getAllClasses, getTrainerClasses, updateClass };
