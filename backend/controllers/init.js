const fs = require("fs").promises;
const path = require("path");
const axios = require("axios"); // Use axios to make API calls

const initRepo = async () => {
  const repoPath = path.resolve(process.cwd(), ".codiumGit");
  console.log(`[1/7] Set repository path to: ${repoPath}`);

  try {
    // Check if a repository is already initialized
    console.log("[2/7] Checking for existing repository...");
    await fs.access(repoPath);
    console.log(
      "-> This directory is already a CodiumGit repository. Exiting."
    );
    return;
  } catch (error) {
    console.log(
      "-> No existing repository found. Proceeding with initialization."
    );
    // If fs.access fails, it means the directory doesn't exist, so we can proceed.
  }

  try {
    // --- Step 1: Create local directories ---
    console.log("[3/7] Creating local .codiumGit directories...");
    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(path.join(repoPath, "staging"), { recursive: true });
    await fs.mkdir(path.join(repoPath, "commits"), { recursive: true });
    console.log("-> Local directories created successfully.");

    // --- Step 2: Prepare data for the backend API call ---
    const repoDetails = {
      name: path.basename(process.cwd()), // Use the current folder's name as the repo name
      description: "Initialized from the command line",
      visibility: true,
      owner: "68d66291a47aba68bf41bf15", // IMPORTANT: In a real app, this ID would come from a logged-in user session.
    };
    console.log("[4/7] Preparing repository data for backend:", repoDetails);

    console.log(
      "[5/7] Sending request to create repository in the database..."
    );
    const response = await axios.post(
      "http://localhost:5000/repo/create", // This uses your existing create endpoint
      repoDetails
    );
    console.log("-> Backend response received successfully.");

    const { repositoryId } = response.data;
    console.log(`[6/7] Retrieved repositoryId from backend: ${repositoryId}`);

    // --- Step 3: Save the repository's database ID to the local config file ---
    const config = { repositoryId };
    console.log("[7/7] Writing repositoryId to local config.json file...");
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify(config, null, 2)
    );

    console.log("\n--- SUCCESS ---");
    console.log(`Initialized empty CodiumGit repository in ${repoPath}`);
    console.log(
      `Successfully linked to database repository with ID: ${repositoryId}`
    );
  } catch (err) {
    // Provide more detailed error feedback
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
