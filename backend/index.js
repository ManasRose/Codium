const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000; // A standard port for APIs

// --- Middleware ---
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// --- MongoDB Connection ---
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// --- API Router ---
// It's good practice to prefix your API routes
app.use("/api", mainRouter);

// --- Socket.IO Setup ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join room", (userID) => {
    console.log(`User ${userID} joined their socket room.`);
    socket.join(userID);
  });
});

// --- Start the Server ---
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
