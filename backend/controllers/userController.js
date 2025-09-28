const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel"); // <-- Ensure this path is correct

// SIGNUP using Mongoose
const signup = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user instance using the Mongoose model
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      // The other fields (description, profileImage) will use the defaults from your schema
    });

    const savedUser = await newUser.save();

    const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      userId: savedUser._id,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// LOGIN using Mongoose
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid Credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid Credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// GET USER PROFILE using Mongoose
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Exclude password from the returned user object for security
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// UPDATE USER PROFILE using Mongoose
const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { username, password, description } = req.body;

  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).send("User not found");
    }

    // Check if the new username is unique (and not the user's current username)
    if (username && username !== userToUpdate.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).send("Username is already taken.");
      }
      userToUpdate.username = username;
    }

    // Update description (allows setting an empty string)
    if (description !== undefined) {
      userToUpdate.description = description;
    }

    // Update password if a new one is provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }

    // Update profile image if a new file was uploaded
    if (req.file) {
      userToUpdate.profileImage = req.file.path; // URL from Cloudinary
    }

    const updatedUser = await userToUpdate.save();
    const { password: _, ...userData } = updatedUser.toObject();
    res.json({ message: "Profile updated successfully!", user: userData });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// DELETE USER PROFILE using Mongoose
const deleteUserProfile = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).send("User not found");
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete Profile Error:", error);
    res.status(500).send("Internal Server Error");
  }
};

// GET ALL USERS (for admin or testing purposes)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password"); // Exclude passwords
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const getStarredRepos = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "starRepos", // Populate the repos from the user's starRepos array
      populate: {
        path: "owner", // Also populate the owner of each repo
        select: "username profileImage", // Only select the fields we need
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(user.starRepos);
  } catch (error) {
    console.error("Error fetching starred repos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUsers,
  getStarredRepos,
};
