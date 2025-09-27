const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// --- ADDED: Mongoose and dotenv for database connection ---
const mongoose = require("mongoose");
require("dotenv").config();

const Repository = require("../models/repoModel");

// --- ADDED: A helper function to connect to MongoDB ---
const connectDB = async () => {
  // Don't try to connect if we already have a connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected for commit operation.");
  } catch (err) {
    console.error("Database connection error for script:", err);
    process.exit(1); // Exit the script if the database can't be reached
  }
};

const commitRepo = async (message) => {
  // --- Step 1: Ensure we have a database connection ---
  await connectDB();

  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const stagedPath = path.join(repoPath, "staging");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    // --- Step 2: Perform local file operations (no changes here) ---
    const commitID = uuidv4();
    const commitDir = path.join(commitsPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });

    const files = await fs.readdir(stagedPath);
    if (files.length === 0) {
      console.log("Nothing to commit, staging area is empty.");
      return;
    }

    for (const file of files) {
      await fs.copyFile(
        path.join(stagedPath, file),
        path.join(commitDir, file)
      );
    }

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify({ message, date: new Date().toISOString() })
    );

    console.log(
      `Commit ${commitID} created locally with message: "${message}"`
    );

    // --- Step 3: Save commit details to the database (no changes here) ---
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);

    const repository = await Repository.findById(repositoryId);

    if (repository) {
      repository.commits.push({
        commitId: commitID,
        message: message,
      });
      await repository.save();
      console.log("Commit details successfully saved to the database.");
    } else {
      console.error(
        `Error: Could not find repository with ID ${repositoryId}.`
      );
    }
  } catch (error) {
    console.error("An error occurred during the commit process:", error);
  } finally {
    // --- Step 4: Close the connection so the script can exit cleanly ---
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
};

module.exports = { commitRepo };
