require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");

const pushRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    // --- Read the repositoryId from the config file ---
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);
    if (!repositoryId) {
      throw new Error("Repository ID not found. Please run 'init' first.");
    }

    const commitDirs = await fs.readdir(commitsPath);
    for (const commitDir of commitDirs) {
      const commitPath = path.join(commitsPath, commitDir);
      const files = await fs.readdir(commitPath);

      for (const file of files) {
        const filePath = path.join(commitPath, file);
        const fileContent = await fs.readFile(filePath);

        // --- Use the repositoryId to create a unique path in S3 ---
        const s3Key = `${repositoryId}/commits/${commitDir}/${file}`;

        const params = {
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: fileContent,
        };
        await s3.upload(params).promise();
      }
    }
    console.log("All local commits pushed to S3 successfully.");
  } catch (err) {
    console.log("Error during push operation: ", err.message);
  }
};

module.exports = { pushRepo };
