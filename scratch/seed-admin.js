const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not defined in .env or .env.local file");
  process.exit(1);
}

// Define Schema locally to avoid import issues
const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    phoneNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const email = "meditimebd@gmail.com";
    const password = "meditime12345";
    const phoneNumber = "01315168075";
    const username = "meditime_admin";

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.findOneAndUpdate(
      { email },
      {
        $set: {
          username,
          email,
          password: hashedPassword,
          role: "superadmin",
          phoneNumber,
        },
      },
      { upsert: true, new: true }
    );

    console.log("Admin account seeded/updated successfully!");
    console.log("Email:", admin.email);
    console.log("Username:", admin.username);
    console.log("Phone Number:", admin.phoneNumber);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedAdmin();
