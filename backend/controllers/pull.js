require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");
pullRepo = async () => {
  console.log("Pulling commits from S3...");
  const repoPath = path.join(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const data = await s3
      .listObjectsV2({ Bucket: S3_BUCKET, Prefix: "commits/" })
      .promise(); // Ensure the prefix matches your S3 structure and data is entered into data

    const objects = data.Contents; // List of objects in the bucket
    for (const object of objects) {
      const key = object.Key; // contains key which is the name of the file in S3 eg: commits/commitID/filename
      const commitDir = path.join(
        commitsPath,
        path.dirname(key).split("/").pop()
      ); // Extract commit directory name from key eg: commits/commitID
      await fs.mkdir(commitDir, { recursive: true }); // Create commit directory
      const params = {
        Bucket: S3_BUCKET,
        Key: key,
      }; // Parameters to get the object from S3
      const fileContent = await s3.getObject(params).promise(); // Get the file content from S3
      await fs.writeFile(path.join(repoPath, key), fileContent.Body); // Write the file content to local file system
    }
    console.log("All commits pulled from S3 successfully.");
  } catch (err) {
    console.log("Error in Pulling, ", err);
  }
};

module.exports = {
  pullRepo,
};
