const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const axios = require("axios");
const FormData = require("form-data"); //specialized library to handle file uploads

// Helper to read the global config for the token
const readGlobalConfig = async () => {
  const configPath = path.join(os.homedir(), ".codiumrc");
  try {
    const configData = await fs.readFile(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    throw new Error("You are not logged in. Please run 'codium login' first.");
  }
};

const pushRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");

  try {
    const configData = await fs.readFile(configPath, "utf8");
    const { repositoryId } = JSON.parse(configData);
    const { token } = await readGlobalConfig();
    const API_BASE_URL = "https://codium-backend.onrender.com/api";

    const commitDirs = await fs.readdir(commitsPath);
    if (commitDirs.length === 0) {
      console.log("No local commits to push.");
      return;
    }

    const latestCommitId = commitDirs[commitDirs.length - 1];
    const commitPath = path.join(commitsPath, latestCommitId);

    // 1. Create a form to send files
    const form = new FormData();

    // 2. Read all files from the latest commit and add them to the form
    const files = await fs.readdir(commitPath);
    for (const file of files) {
      if (file !== "commit.json") {
        // Don't upload the local commit.json
        const filePath = path.join(commitPath, file);
        const fileContent = await fs.readFile(filePath);
        +-9 / form.append("files", fileContent, file); // Append file with its name
      }
    }

    // 3. Get the commit message and add it to the form
    const commitJsonPath = path.join(commitPath, "commit.json");
    const commitJsonData = await fs.readFile(commitJsonPath, "utf8");
    const { message } = JSON.parse(commitJsonData);
    form.append("message", message || "Pushed commit");

    // 4. Send the entire form to your existing upload endpoint
    await axios.post(`${API_BASE_URL}/repo/${repositoryId}/upload`, form, {
      headers: {
        ...form.getHeaders(), // Important for multipart/form-data
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("\n✅ Push successful! Your repository is now up to date.");
  } catch (err) {
    console.error(
      "\n❌ Error during push operation:",
      err.response ? err.response.data : err.message
    );
  }
};

module.exports = { pushRepo };
