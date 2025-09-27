const fs = require("fs").promises;
const path = require("path");

const addRepo = async (filePath) => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const stagingPath = path.join(repoPath, "staging");

  try {
    await fs.mkdir(stagingPath, { recursive: true });
    const fileName = path.basename(filePath);
    await fs.copyFile(filePath, path.join(stagingPath, fileName));
    console.log(`File '${fileName}' added to staging area.`);
  } catch (err) {
    console.error(`Error adding file:`, err.message);
  }
};

module.exports = { addRepo };
