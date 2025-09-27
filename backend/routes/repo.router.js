const express = require("express");
const repoController = require("../controllers/repoController");

const repoRouter = express.Router();

repoRouter.post("/repo/create", repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/recent", repoController.getRecentRepositories);

// Using a more precise and robust regular expression
repoRouter.get(
  /^\/repo\/([^/]+)\/contents\/?(.*)/,
  repoController.getRepoContents
);
repoRouter.get(
  /^\/repo\/([^/]+)\/commit\/([^/]+)\/file\/(.*)/,
  repoController.getRepoFileContent
);

repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);
repoRouter.get(
  "/repo/user/:userID",
  repoController.fetchRepositoriesForCurrentUser
);
repoRouter.patch("/repo/toggle/:id", repoController.toggleVisibilityById);
repoRouter.put("/repo/update/:id", repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);

module.exports = repoRouter;
