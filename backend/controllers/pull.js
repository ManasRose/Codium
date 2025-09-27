require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config"); // Ensure you have this config file

const pullRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    console.log("Reading repository configuration...");
    // --- Step 1: Read the repository's unique ID from the local config file ---
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);

    if (!repositoryId) {
      throw new Error(
        "Repository ID not found in config.json. Please run 'init' first."
      );
    }
    console.log(`Pulling commits for repository: ${repositoryId}`);

    // --- Step 2: List objects in S3 for this specific repository ---
    const params = {
      Bucket: S3_BUCKET,
      // The Prefix is crucial to only get files for this repo
      Prefix: `${repositoryId}/commits/`,
    };
    const data = await s3.listObjectsV2(params).promise();
    console.log(`Found ${data.KeyCount} objects in S3 for this repository.`);
    if (!data.Contents || data.Contents.length === 0) {
      console.log("No remote commits found to pull.");
      return;
    }

    // --- Step 3: Download each file and place it in the correct local commit folder ---
    for (const object of data.Contents) {
      const s3Key = object.Key;

      // Extract the commit ID and filename from the S3 key
      // e.g., "repoId/commits/commitId/hello.txt" -> "commitId"
      const keyParts = s3Key.split("/");
      if (keyParts.length < 4) continue; // Skip the folder itself

      const commitId = keyParts[2];
      const fileName = keyParts[3];

      const localCommitDir = path.join(commitsPath, commitId);
      await fs.mkdir(localCommitDir, { recursive: true });

      const downloadParams = {
        Bucket: S3_BUCKET,
        Key: s3Key,
      };

      const fileContent = await s3.getObject(downloadParams).promise();
      await fs.writeFile(path.join(localCommitDir, fileName), fileContent.Body);
    }

    console.log("All remote commits pulled from S3 successfully.");
  } catch (err) {
    console.error("Error during pull operation:", err.message);
  }
};

module.exports = {
  pullRepo,
};
