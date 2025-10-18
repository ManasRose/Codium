#!/usr/bin/env node //shebang to tell the system to use node to execute this file, we can run this file directly from terminal

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers"); //hides bin commands like node and file name

const { loginUser } = require("./controllers/login");
const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");

yargs(hideBin(process.argv))
  .command("login", "Log in to your Codium account", {}, loginUser)
  .command("init", "To initialize the repo", {}, initRepo)
  .command(
    "add <file>", //command (The angle brackets < > signify a required positional argument)
    "To Add a file to the staging area", //description (describes what the command does to the user)
    (yargs) => {
      //builder (configure more advanced options and arguments for the command, like positional arguments, options, etc.)
      yargs.positional("file", {
        describe: "File to add",
        type: "string",
      });
    }, //describes which arguments are expected
    (argv) => {
      //handler
      addRepo(argv.file);
    } //yargs constructs an argv object and passes it to the handler
  )
  .command(
    "commit <message>",
    "Commit staged files",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit Message",
        type: "string",
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
        describe: "The full ID of the commit to revert to",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    }
  )
  .demandCommand(1, "You need at least one command before moving on.")
  .help()
  .parse(); //this will parse the arguments and execute the appropriate command
