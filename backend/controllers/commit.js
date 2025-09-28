const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Repository = require("../models/repoModel");

// --- FIX: Corrected the path to go up only one level ---
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Helper function for the database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connected for script.");
  } catch (err) {
    console.error("Database connection error for script:", err.message);
    process.exit(1);
  }
};

const commitRepo = async (message) => {
  await connectDB();

  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const stagingPath = path.join(repoPath, "staging");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const stagedFiles = await fs.readdir(stagingPath);
    if (stagedFiles.length === 0) {
      console.log("Nothing to commit, staging area is empty.");
      await mongoose.disconnect();
      return;
    }

    const commitId =
      new Date().toISOString().replace(/[:.]/g, "-") +
      "-" +
      Math.random().toString(36).substr(2, 9);
    const commitDir = path.join(commitsPath, commitId);
    await fs.mkdir(commitDir);

    for (const file of stagedFiles) {
      const sourcePath = path.join(stagingPath, file);
      const destPath = path.join(commitDir, file);
      await fs.rename(sourcePath, destPath);
    }

    const commitData = {
      id: commitId,
      message,
      timestamp: new Date().toISOString(),
      files: stagedFiles,
    };
    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(commitData, null, 2)
    );

    console.log(`Committed ${stagedFiles.length} file(s): ${commitId}`);
  } catch (err) {
    console.error("Error during commit:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
};

module.exports = { commitRepo };
