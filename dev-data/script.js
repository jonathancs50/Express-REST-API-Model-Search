const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Model = require("../models/modelModel");
const User = require("../models/userModel");

// Setup our env variables
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connection) => {
    console.log("DB connected successfully!");
  });

// Read JSON files
const models = JSON.parse(
  fs.readFileSync("./dev-data/complete-model-profiles.json", "utf-8")
);
const users = JSON.parse(fs.readFileSync("./dev-data/users.json", "utf-8"));

// Import Data
const importData = async () => {
  try {
    await Model.create(models);
    await User.create(users, { validateBeforeSave: false });
    console.log("Data successfully loaded");
  } catch (err) {
    console.log(err);
  }
};

// Delete all data from database
const deleteData = async () => {
  try {
    await Model.deleteMany();
    await User.deleteMany();
    console.log("DB deleted!");
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === "--import") {
  importData().then(() => process.exit());
} else if (process.argv[2] === "--delete") {
  deleteData().then(() => process.exit());
}
