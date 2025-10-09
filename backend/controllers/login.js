// backend/controllers/login.js

const inquirer = require("inquirer");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

const loginUser = async () => {
  try {
    // 1. Prompt the user for their credentials
    const credentials = await inquirer.default.prompt([
      // <-- THIS IS THE ONLY CHANGE
      {
        name: "username",
        message: "Enter your username:",
        type: "input",
      },
      {
        name: "password",
        message: "Enter your password:",
        type: "password",
      },
    ]);

    const API_BASE_URL = "https://codium-backend.onrender.com/api";

    console.log("Attempting to log in...");

    // 2. Send credentials to your backend's login endpoint
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username: credentials.username,
      password: credentials.password,
    });

    const { token } = response.data;
    if (!token) {
      throw new Error("Login failed, no token received.");
    }

    // 3. Save the token to a global config file in the user's home directory
    const configPath = path.join(os.homedir(), ".codiumrc");
    const configData = { token };

    await fs.writeFile(configPath, JSON.stringify(configData, null, 2));

    console.log("\n✅ Successfully logged in!");
    console.log(`Authentication token saved to ${configPath}`);
  } catch (error) {
    console.error("\n❌ Login failed.");
    if (error.response) {
      // The server responded with an error status code (e.g., 401, 500)
      console.error(`API Error: ${error.response.data.error}`);
    } else if (error.request) {
      // The request was made but no response was received (server is not running)
      console.error(
        "Network Error: Could not connect to the server. Please ensure it is running."
      );
    } else {
      // Something else went wrong in setting up the request
      console.error(`Error: ${error.message}`);
    }
  }
};

module.exports = { loginUser };
