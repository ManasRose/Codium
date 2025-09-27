const fs = require("fs").promises;
const path = require("path");

const revertRepo = async (commitID) => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitPath = path.join(repoPath, "commits", commitID);
  const workingDirPath = process.cwd(); // This is your main project folder

  try {
    console.log(`Attempting to revert to commit: ${commitID}`);

    // --- Step 1: Check if the commit folder actually exists locally ---
    try {
      await fs.access(commitPath);
    } catch (error) {
      console.error(
        `Error: Commit with ID "${commitID}" was not found locally.`
      );
      console.log(
        "Tip: Run 'node index.js pull' to get the latest commits, or 'node index.js log' to see available commit IDs."
      );
      return;
    }

    // --- Step 2: Get a list of all files from that commit ---
    const filesToRevert = await fs.readdir(commitPath);
    console.log(`Found ${filesToRevert.length - 1} file(s) in this commit.`);

    // --- Step 3: Copy each file to your main working directory ---
    for (const file of filesToRevert) {
      // We don't want to restore the commit's metadata file
      if (file === "commit.json") {
        continue;
      }

      const sourcePath = path.join(commitPath, file);
      const destinationPath = path.join(workingDirPath, file);

      console.log(`- Restoring file: ${file}`);
      await fs.copyFile(sourcePath, destinationPath);
    }

    console.log(`\n--- SUCCESS ---`);
    console.log(`Successfully reverted your project to commit ${commitID}.`);
    console.log("Your working directory has been updated.");
  } catch (err) {
    console.error("\n--- ERROR ---");
    console.error(
      "An error occurred during the revert operation:",
      err.message
    );
  }
};

module.exports = { revertRepo };
