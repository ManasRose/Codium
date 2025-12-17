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

const allowedOrigins = [
  "http://localhost:5173", // For local development
  "https://main.d293vwejwkqvcf.amplifyapp.com",
  // You can add more URLs here if needed
];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
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
    origin: allowedOrigins, // Reuse the same allowed origins list
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join room", (userID) => {
    console.log(`User ${userID} joined their socket room.`);
    socket.join(userID);
  });
});
