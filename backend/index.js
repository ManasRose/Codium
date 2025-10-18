const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router");

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 5000; // A standard port for APIs

// Middleware
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI).catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});

// API Router
app.use("/api", mainRouter);

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Welcome to Codium!! Server is running on port: ${port}`);
});

// Attach new Socket.IO server to the existing Express server
const io = new Server(server, {
  cors: {
    // allow WebSocket connections from any origin
    origin: "*",
    methods: ["GET", "POST"],
  },
}); // This part adds real-time, two-way communication capabilities on top of the existing Express server.

//Socket.IO logic
io.on("connection", (socket) => {
  socket.on("join room", (userID) => {
    console.log(`User ${userID} joined their socket room.`);
    socket.join(userID);
  });
});
