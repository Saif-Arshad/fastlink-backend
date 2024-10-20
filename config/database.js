const mongoose = require("mongoose");
require("dotenv").config();

const connectionOptions = {
  ssl: true,
};

const dbUri = process.env.MONGO_URI;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(dbUri, connectionOptions);
    console.log("Database connection has been established successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};

connectToDatabase();

module.exports = { mongoose, connectToDatabase };
