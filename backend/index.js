const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); //<---------------- allows connection of frontend with backend even if on different ports
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io"); //<----------------
const mainRouter = require("./routes/main.router");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");

dotenv.config();

//We are going to use command type logic

yargs(hideBin(process.argv))
  .command("start", "To start the server", {}, startServer)
  .command("init", "To initialize the repo", {}, initRepo)
  .command(
    "add <file>",
    "To Add the Repo",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add To Staging Area",
        type: "String",
      });
    },
    (argv) => {
      /*yargs takes the input and creates an argv object, which has different feilds like {(_: ['add']), file: 'test.txt', '$0': 'app.js'}*/
      addRepo(argv.file);
    }
  )
  .command(
    "commit <message>",
    "Commit to Staged Files",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit Message",
        type: "String",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    }
  )
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits from S3", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Commit ID to revert to",
        type: "String",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    }
  )
  .demandCommand(1, "You need at least one command before moving on")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  app.use(bodyParser.json()); // for parsing application/json
  app.use(express.json()); //<---------------- allows us to send json objects in req body

  //MongoDB connection

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

  //CORS

  app.use(cors({ origin: "*" }));

  app.use(bodyParser.urlencoded({ extended: true }));

  //ROUTER

  app.use("/", mainRouter); //IMPORTANT

  //SOCKET.IO
  let user = "test";
  const httpServer = http.createServer(app); //<---------------- creating a http server using express app
  const io = new Server(httpServer, {
    //<---------------- creating a socket io server using the http server
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  //Socket io connection

  io.on("connection", (socket) => {
    socket.on("join room", (userID) => {
      user = userID;
      console.log("========");
      console.log(user);
      console.log("========");
      socket.join(userID);
    });
  }); //<---------------- socket io connection

  const db = mongoose.connection;
  db.once("open", () => {
    console.log("Crud Operations Called");
  }); //<---------------- once the connection to mongo is open, we can perform crud operations

  //Starting the server

  httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }); //<---------------- we are using httpServer to listen instead of app
}
