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

module.exports = {
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUsers,
};

// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const { MongoClient, ObjectId } = require("mongodb"); //could use mongoose instead of this as well (index.js mein mongoose use kiya hai)
// const dotenv = require("dotenv");
// dotenv.config();

// // MongoDB connection setup
// const uri = process.env.MONGO_URI;
// let client;
// async function connectClient() {
//   if (!client) {
//     client = new MongoClient(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     await client.connect();
//   }
// }

// //SIGNUP
// const signup = async (req, res) => {
//   const { username, password, email } = req.body;
//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = await db.collection("users");
//     const user = await usersCollection.findOne({ username });

//     if (user) {
//       return res.status(400).send("User already exists");
//     }
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = {
//       username,
//       email,
//       password: hashedPassword,
//       description: "",
//       profileImage:
//         "https://res.cloudinary.com/demo/image/upload/v1620000000/avatar_placeholder.png",
//       repositories: [],
//       followedUsers: [],
//       starRepos: [],
//     };

//     const result = await usersCollection.insertOne(newUser);
//     const token = jwt.sign(
//       { id: result.insertedId },
//       process.env.JWT_SECRET_KEY,
//       {
//         expiresIn: "1h",
//       }
//     );
//     res.status(201).json({
//       message: "User created successfully",
//       token,
//       userId: result.insertedId,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// //LOGIN
// const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = await db.collection("users");
//     const user = await usersCollection.findOne({ email });

//     if (!user) {
//       return res.status(500).send("Invalid Credentials");
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(500).send("Invalid Credentials");
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
//       expiresIn: "1h",
//     });
//     res.json({ token, userId: user._id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// const getAllUsers = async (req, res) => {
//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = await db.collection("users");
//     const users = await usersCollection.find({}).toArray();
//     res.json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// const getUserProfile = async (req, res) => {
//   const userId = req.params.id;
//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = await db.collection("users");
//     const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
//     if (!user) {
//       return res.status(404).send("User not found");
//     }
//     res.json(user);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// //UPDATE

// // (Your connectClient, signup, login, etc., functions remain here)

// // --- UPDATED CONTROLLER FUNCTION ---
// const updateUserProfile = async (req, res) => {
//   const userId = req.params.id;
//   // Get the new data from the request body
//   const { username, password, description } = req.body;

//   // Validate the ObjectId format
//   if (!ObjectId.isValid(userId)) {
//     return res.status(400).send("Invalid userId format");
//   }

//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = db.collection("users");

//     // Initialize an object to hold only the fields we want to update
//     const updatedFields = {};

//     // --- Conditionally add fields to the update object ---

//     // 1. Check if a new username is provided and if it's unique
//     if (username) {
//       const existingUser = await usersCollection.findOne({ username });
//       // Ensure the new username isn't already taken by another user
//       if (existingUser && existingUser._id.toString() !== userId) {
//         return res.status(400).send("Username is already taken.");
//       }
//       updatedFields.username = username;
//     }

//     // 2. Check if a new password is provided and hash it
//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       updatedFields.password = await bcrypt.hash(password, salt);
//     }

//     // 3. Check if a description is provided (allows setting an empty string)
//     if (description !== undefined) {
//       updatedFields.description = description;
//     }

//     // 4. Check if a new image file was uploaded by multer
//     if (req.file) {
//       // The `req.file.path` contains the URL from Cloudinary
//       updatedFields.profileImage = req.file.path;
//     }

//     // If no data was sent to update, return an error
//     if (Object.keys(updatedFields).length === 0) {
//       return res.status(400).send("No fields to update.");
//     }

//     // Perform the update operation in the database
//     const result = await usersCollection.findOneAndUpdate(
//       { _id: new ObjectId(userId) },
//       { $set: updatedFields },
//       { returnDocument: "after" } // This option returns the updated document
//     );

//     if (!result.value) {
//       return res.status(404).send("User not found");
//     }

//     res.json({ message: "Profile updated successfully!", user: result.value });
//   } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// module.exports = {
//   // ... your other exports
//   updateUserProfile, // Ensure you export the updated function
// };

// const deleteUserProfile = async (req, res) => {
//   const userId = req.params.id;
//   try {
//     await connectClient();
//     const db = client.db("CodiumMR04");
//     const usersCollection = await db.collection("users");
//     const result = await usersCollection.deleteOne({
//       _id: new ObjectId(userId),
//     });
//     if (result.deletedCount === 0) {
//       return res.status(404).send("User not found");
//     }
//     res.json({ message: "User deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

// module.exports = {
//   getAllUsers,
//   signup,
//   login,
//   getUserProfile,
//   updateUserProfile,
//   deleteUserProfile,
// };
