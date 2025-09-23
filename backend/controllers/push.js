require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");

const { s3, S3_BUCKET } = require("../config/aws-config");

pushRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitDirs = await fs.readdir(commitsPath);
    for (const commitDir of commitDirs) {
      const commitPath = path.join(commitsPath, commitDir);
      const files = await fs.readdir(commitPath);
      for (const file of files) {
        const filePath = path.join(commitPath, file);
        const fileContent = await fs.readFile(filePath);

        const params = {
          Bucket: S3_BUCKET,
          Key: `commits/${commitDir}/${file}`,
          Body: fileContent,
        };
        await s3.upload(params).promise();
      }
    }
    console.log("All commits pushed to S3 successfully.");
  } catch (err) {
    console.log("Error in Pushing, ", err);
  }
};
module.exports = { pushRepo };
