// backend/controllers/init.js

const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const os = require("os");
const { jwtDecode } = require("jwt-decode");

const readGlobalConfig = async () => {
  const configPath = path.join(os.homedir(), ".codiumrc");
  try {
    const configData = await fs.readFile(configPath, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    throw new Error("You are not logged in. Please run 'codium login' first.");
  }
};

const initRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  console.log(`[1/7] Set repository path to: ${repoPath}`);

  try {
    await fs.access(repoPath);
    console.log(
      "-> This directory is already a CodiumGit repository. Exiting."
    );
    return;
  } catch (error) {
    console.log(
      "-> No existing repository found. Proceeding with initialization."
    );
  }

  try {
    const { token } = await readGlobalConfig();
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    // --- THIS IS THE CORRECTED URL ---
    const API_BASE_URL = "https://codium-backend.onrender.com/api";

    console.log("[3/7] Creating local .codiumGit directories...");
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, "staging"), { recursive: true });
    await fs.mkdir(path.join(repoPath, "commits"), { recursive: true });
    console.log("-> Local directories created successfully.");

    const repoDetails = {
      name: path.basename(process.cwd()),
      description: "Initialized from the command line",
      visibility: true,
      owner: userId,
    };
    console.log("[4/7] Preparing repository data for backend:", repoDetails);

    console.log(
      "[5/7] Sending request to create repository in the database..."
    );
    const response = await axios.post(
      `${API_BASE_URL}/repo/create`, // The path is now correct
      repoDetails
    );
    console.log("-> Backend response received successfully.");

    const { repositoryId } = response.data;
    console.log(`[6/7] Retrieved repositoryId from backend: ${repositoryId}`);

    const config = { repositoryId };
    console.log("[7/7] Writing repositoryId to local config.json file...");
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(config, null, 2)
    );

    console.log("\n--- SUCCESS ---");
    console.log(`Initialized empty CodiumGit repository in ${repoPath}`);
  } catch (err) {
    console.error("\n--- ERROR ---");
    if (err.response) {
      console.error(
        "An error occurred during the API call:",
        err.response.data
      );
    } else {
      console.error("An error occurred during initialization:", err.message);
    }
  }
};

module.exports = { initRepo };
