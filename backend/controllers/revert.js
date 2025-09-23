const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readdir = promisify(fs.readdir); //readdir will only read names of dir if it exists or gives error
const copyFile = promisify(fs.copyFile); //these are wrappers to convert callback based functions to promise based functions

revertRepo = async (commitID) => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const commitDir = path.join(commitsPath, commitID);
    const files = await readdir(commitDir);
    const parentDir = path.resolve(repoPath, "..");

    for (const file of files) {
      await copyFile(path.join(commitDir, file), path.join(parentDir, file));
    }
    console.log(`Reverted to commit ${commitID} successfully`);
  } catch (err) {
    console.error("Error accessing repository:", err.message);
  }
};
module.exports = { revertRepo };
