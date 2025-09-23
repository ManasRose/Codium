const fs = require("fs").promises;
const path = require("path");

initRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit"); // \Users\PREDATOR\OneDrive\Desktop\MainProject\.codiumGit
  const commitPath = path.join(repoPath, "commits"); // \Users\PREDATOR\OneDrive\Desktop\MainProject\.codiumGit\commits

  try {
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitPath, { recursive: true });
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify({ bucket: "codium-Bucket" })
    );
    console.log("Repository initialized successfully.");
  } catch (err) {
    console.error(err);
  }
};

module.exports = { initRepo };
