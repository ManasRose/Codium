const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb"); //could use mongoose instead of this as well (index.js mein mongoose use kiya hai)
const dotenv = require("dotenv");

dotenv.config();

// MongoDB connection setup
const uri = process.env.MONGO_URI;
let client;
async function connectClient() {
  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  }
}

//SIGNUP
const signup = async (req, res) => {
  const { username, password, email } = req.body;
  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = await db.collection("users");
    const user = await usersCollection.findOne({ username });

    if (user) {
      return res.status(400).send("User already exists");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);
    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.status(201).json({
      message: "User created successfully",
      token,
      userId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = await db.collection("users");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(500).send("Invalid Credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(500).send("Invalid Credentials");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = await db.collection("users");
    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getUserProfile = async (req, res) => {
  const userId = req.params.id;
  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = await db.collection("users");
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//UPDATE

const updateUserProfile = async (req, res) => {
  const userId = req.params.id;
  console.log("UserId:", userId); // Debugging line

  // Check if userId is a valid ObjectId
  if (!ObjectId.isValid(userId)) {
    // This now uses the ObjectId from the top of the file
    return res.status(400).send("Invalid userId format");
  }

  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = db.collection("users");

    let updatedFields = {};
    if (email) updatedFields.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updatedFields.password = hashedPassword;
    }

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).send("No valid fields to update");
    }

    // Log the query to debug
    console.log("Updating user with ID:", userId);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updatedFields },
      { returnDocument: "after" }
    );
    if (!result) {
      return res.status(404).send("User not found");
    }
    res.json({ message: "Profile updated", user: result.value });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteUserProfile = async (req, res) => {
  const userId = req.params.id;
  try {
    await connectClient();
    const db = client.db("CodiumMR04");
    const usersCollection = await db.collection("users");
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).send("User not found");
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
