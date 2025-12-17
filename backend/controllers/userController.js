const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

// 1. SIGNUP
const signup = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    // Check if email OR username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      // Ensure a default profile image is set if you want consistency
      profileImage:
        "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg",
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      { userId: savedUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      userId: savedUser._id, // Sending userId is crucial
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. LOGIN
const login = async (req, res) => {
  // Frontend might send 'email' or 'username' in the body
  const { email, username, password } = req.body;

  try {
    let user;

    if (email) {
      user = await User.findOne({ email });
    } else if (username) {
      user = await User.findOne({ username });
    } else {
      const loginIdentifier = email || username;
      if (loginIdentifier) {
        user = await User.findOne({
          $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
        });
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token, userId: user._id });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
};

// 3. GET USER PROFILE
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 4. UPDATE PROFILE
const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  const { username, password, description } = req.body;
  try {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    if (username && username !== userToUpdate.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken." });
      }
      userToUpdate.username = username;
    }

    if (description !== undefined) {
      userToUpdate.description = description;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      userToUpdate.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      userToUpdate.profileImage = req.file.path;
    }

    const updatedUser = await userToUpdate.save();
    const { password: _, ...userData } = updatedUser.toObject();
    res.json({ message: "Profile updated successfully!", user: userData });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteUserProfile = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete Profile Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getStarredRepos = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "starRepos",
      populate: {
        path: "owner",
        select: "username profileImage",
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
