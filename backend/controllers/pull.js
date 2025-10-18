// Use { quiet: true } to prevent extra logs from dotenv
require("dotenv").config({ quiet: true });
const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config"); // This now imports your new v3 client

// 1. Import the specific commands needed from the AWS SDK v3
const {
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const pullRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    console.log("Reading repository configuration...");
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);

    if (!repositoryId) {
      throw new Error(
        "Repository ID not found in config.json. Please run 'init' first."
      );
    }

    const params = {
      Bucket: S3_BUCKET,
      Prefix: `${repositoryId}/commits/`,
    };

    // 2. Use the new "send" command pattern for listing objects
    const data = await s3.send(new ListObjectsV2Command(params));

    if (!data.Contents || data.Contents.length === 0) {
      console.log("No remote commits found to pull.");
      return;
    }

    for (const object of data.Contents) {
      const s3Key = object.Key;

      const keyParts = s3Key.split("/");
      if (keyParts.length < 4) continue;

      const commitId = keyParts[2];
      const fileName = keyParts[3];

      const localCommitDir = path.join(commitsPath, commitId);
      await fs.mkdir(localCommitDir, { recursive: true });

      const downloadParams = {
        Bucket: S3_BUCKET,
        Key: s3Key,
      };

      // 3. Use the new "send" command pattern for getting an object
      const response = await s3.send(new GetObjectCommand(downloadParams));

      // 4. The response body is a stream, so we convert it to a byte array (Buffer)
      const fileBuffer = await response.Body.transformToByteArray();
      await fs.writeFile(path.join(localCommitDir, fileName), fileBuffer);
    }

    console.log("All remote commits pulled from S3 successfully.");
  } catch (err) {
    console.error("Error during pull operation:", err.message);
  }
};

module.exports = {
  pullRepo,
};
