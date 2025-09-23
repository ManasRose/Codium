const fs = require("fs").promises;
const path = require("path");

addRepo = async (filePath) => {
  // filePath is the path of the file provided by the user
  const repoPath = path.resolve(process.cwd(), ".codiumGit"); // \Users\PREDATOR\OneDrive\Desktop\MainProject\.codiumGit
  const stagingPath = path.join(repoPath, "staging"); // \Users\PREDATOR\OneDrive\Desktop\MainProject\.codiumGit + \staging
  try {
    await fs.mkdir(stagingPath, { recursive: true }); //recursive: true means that if the directory doesn't exist, it will be created
    const fileName = path.basename(filePath); // get the name of the file provided by the user
    await fs.copyFile(filePath, path.join(stagingPath, fileName)); // copy the filePath (new file) to the staging directory where it overwrites over fileName (old file under same name)
    console.log(`File ${fileName} added to staging area.`);
  } catch (err) {
    console.error(err);
  }
};
module.exports = { addRepo };
