const Plan = require('../models/Plan');

// Create Initial Plans (Seed) if none exist
exports.seedPlans = async (req, res) => {
    try {
        const existingCount = await Plan.countDocuments();
        if (existingCount > 0) {
            return res.status(200).json({ message: "Plans already seeded." });
        }

        const initialPlans = [
            {
                name: "Basic",
                price: 10000,
                desc: "Perfect for beginners starting their fitness journey.",
                image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&q=80",
                features: ["Gym Access", "1 Personal Training Session", "Group Classes"],
                isBestValue: false,
            },
            {
                name: "Pro",
                price: 25000,
                desc: "Best for consistent fitness improvement.",
                image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
                features: ["Gym Access", "Weekly PT", "Group Classes", "Nutrition Plan"],
                isBestValue: false,
            },
            {
                name: "Elite",
                price: 45000,
                desc: "Best value package for serious fitness lovers.",
                image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
                features: ["All Pro Features", "Unlimited PT", "Wellness Coaching", "Sauna Access"],
                isBestValue: true,
            },
        ];

        await Plan.insertMany(initialPlans);
        res.status(201).json({ message: "Plans successfully seeded!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Plans
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ price: 1 });
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Plan (Admin Only)
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, desc, features, image, isBestValue } = req.body;

        // Parse features if they come as string (comma separated) or array
        let processedFeatures = features;
        if (typeof features === 'string') {
            processedFeatures = features.split(',').map(f => f.trim());
        }

        const updatedPlan = await Plan.findByIdAndUpdate(
            id,
            { name, price, desc, features: processedFeatures, image, isBestValue },
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
