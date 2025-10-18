const fs = require("fs").promises;
const path = require("path");

const addRepo = async (filePath) => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit"); //link to .codiumGit directory
  const stagingPath = path.join(repoPath, "staging"); //link to staging area inside .codiumGit

  try {
    await fs.mkdir(stagingPath, { recursive: true }); //ensure staging directory exists, create if not
    const fileName = path.basename(filePath); //extract file name from the provided file path in the command
    await fs.copyFile(filePath, path.join(stagingPath, fileName)); //copy the specified file from the provided path to the staging area
    console.log(`File '${fileName}' added to staging area.`);
  } catch (err) {
    console.error(`Error adding file:`, err.message);
  }
};

module.exports = { addRepo };
