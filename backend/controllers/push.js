// --- FIX: Tell dotenv the exact path to your .env file ---
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const axios = require("axios");
const { s3, S3_BUCKET } = require("../config/aws-config");

// Helper to read the global config for the token
const readGlobalConfig = async () => {
  const configPath = path.join(os.homedir(), ".codiumrc");
  try {
    const configData = await fs.readFile(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    throw new Error("You are not logged in. Please run 'codium login' first.");
  }
};

const pushRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);
    const { token } = await readGlobalConfig();
    const API_BASE_URL = "https://codium-backend.onrender.com/api"; // Using the deployed URL

    const commitDirs = await fs.readdir(commitsPath);
    if (commitDirs.length === 0) {
      console.log("No local commits to push.");
      return;
    }

    console.log("Uploading files to S3...");
    for (const commitDir of commitDirs) {
      const commitPath = path.join(commitsPath, commitDir);
      const files = await fs.readdir(commitPath);
      for (const file of files) {
        const filePath = path.join(commitPath, file);
        const fileContent = await fs.readFile(filePath);
        const s3Key = `${repositoryId}/commits/${commitDir}/${file}`;
        const params = { Bucket: S3_BUCKET, Key: s3Key, Body: fileContent };
        await s3.upload(params).promise();
      }
    }
    console.log("File uploads complete.");

    console.log("Updating database with new commit information...");
    const latestCommitId = commitDirs[commitDirs.length - 1];
    const commitJsonPath = path.join(
      commitsPath,
      latestCommitId,
      "commit.json"
    );
    const commitJsonData = await fs.readFile(commitJsonPath, "utf8");
    const { message, timestamp } = JSON.parse(commitJsonData);

    const commitPayload = {
      commitId: latestCommitId,
      message,
      timestamp,
    };

    await axios.post(
      `${API_BASE_URL}/repo/${repositoryId}/commit`,
      commitPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("\n✅ Push successful! Your repository is now up to date.");
  } catch (err) {
    console.error("\n❌ Error during push operation:", err.message);
  }
};

module.exports = { pushRepo };
