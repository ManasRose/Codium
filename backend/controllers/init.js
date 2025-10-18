const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const os = require("os");
const { jwtDecode } = require("jwt-decode");

//function to check if logged in
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
  const repoPath = path.resolve(process.cwd(), ".codiumGit"); //path for the local repository's hidden directory

  //check if already initialized
  try {
    await fs.access(repoPath); // Check if .codiumGit directory already exists
    console.log("-> This directory is already a CodiumGit repository.");
    return;
  } catch (error) {
    // Directory does not exist, continue with initialization
  }

  try {
    const { token } = await readGlobalConfig(); // Read the global config to get the token
    const decodedToken = jwtDecode(token); //A JWT is not encrypted, just encoded
    const userId = decodedToken.userId;

    const API_BASE_URL = "https://codium-backend.onrender.com/api";

    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, "staging"), { recursive: true });
    await fs.mkdir(path.join(repoPath, "commits"), { recursive: true });

    const repoDetails = {
      name: path.basename(process.cwd()), // Use current directory name as repo name
      description: "",
      visibility: true,
      owner: userId,
    };

    //create repo in the backend
    const response = await axios.post(
      `${API_BASE_URL}/repo/create`,
      repoDetails
    );

    const { repositoryId } = response.data; //get repositoryId from backend

    const config = { repositoryId }; //local config for the repo
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(config, null, 2)
    );

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
