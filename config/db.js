const mongoose = require("mongoose");
require("dotenv").config();

const dbUrl = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(dbUrl, {
      family: 4,
    });

    console.log("MongoDB connection successful");
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
