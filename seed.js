const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./src/models/Admin');
const Member = require('./src/models/Member');
const Trainer = require('./src/models/Trainer');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB for seeding'))
    .catch(err => {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // 1. Create/Update Admin
        const adminEmail = "admin@supremfitnes.com";
        const adminPass = "admin12345";
        const hashedAdminPass = await bcrypt.hash(adminPass, 10);

        const admin = await Admin.findOneAndUpdate(
            { email: adminEmail },
            {
                name: "Super Admin",
                email: adminEmail,
                password: hashedAdminPass,
                role: "admin"
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Admin updated/created: ${admin.email}`);

        // 2. Create Sample Trainers
        const trainers = [
            { name: "John Cena", email: "john@trainer.com", password: "password123" },
            { name: "The Rock", email: "rock@trainer.com", password: "password123" }
        ];

        for (const t of trainers) {
            const existing = await Trainer.findOne({ email: t.email });
            if (!existing) {
                const hashedIds = await bcrypt.hash(t.password, 10);
                await Trainer.create({
                    name: t.name,
                    email: t.email,
                    password: hashedIds,
                    isVerified: true,
                    isApproved: true
                });
                console.log(`✅ Trainer created: ${t.email}`);
            } else {
                console.log(`ℹ️ Trainer already exists: ${t.email}`);
            }
        }

        // 3. Create Sample Members
        const members = [
            { name: "Alice Wonderland", email: "alice@member.com", password: "password123" },
            { name: "Bob Builder", email: "bob@member.com", password: "password123" },
            { name: "Charlie Chaplin", email: "charlie@member.com", password: "password123", isApproved: false } // Pending approval
        ];

        for (const m of members) {
            const existing = await Member.findOne({ email: m.email });
            if (!existing) {
                const hashedIds = await bcrypt.hash(m.password, 10);
                await Member.create({
                    name: m.name,
                    email: m.email,
                    password: hashedIds,
                    isVerified: true,
                    isApproved: m.isApproved !== undefined ? m.isApproved : true
                });
                console.log(`✅ Member created: ${m.email}`);
            } else {
                console.log(`ℹ️ Member already exists: ${m.email}`);
            }
        }

        console.log("🌱 Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
