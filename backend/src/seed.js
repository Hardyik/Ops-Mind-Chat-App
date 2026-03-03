import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const seedUsers = [
    {
        name: "Admin User",
        email: "admin@infotact.com",
        password: "admin123",
        role: "admin",
    },
    {
        name: "John Employee",
        email: "john@infotact.com",
        password: "employee123",
        role: "employee",
    },
    {
        name: "Sarah Smith",
        email: "sarah@infotact.com",
        password: "employee123",
        role: "employee",
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/opsmind");
        console.log("🍃 Connected to MongoDB");

        // Clear existing users
        await User.deleteMany({});
        console.log("🗑️  Cleared existing users");

        // Create users (password hashing happens in the model pre-save hook)
        const users = await User.create(seedUsers);
        console.log(`✅ Created ${users.length} users:`);
        users.forEach((u) => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));

        console.log("\n🎉 Seed complete! You can now login with:");
        console.log("   Admin: admin@infotact.com / admin123");
        console.log("   Employee: john@infotact.com / employee123");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
