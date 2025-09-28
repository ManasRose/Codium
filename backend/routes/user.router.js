const express = require("express");
const userController = require("../controllers/userController");
const upload = require("../config/multer-config");
const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);
userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.get("/user/:userId/starred", userController.getStarredRepos);
userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put(
  "/updateProfile/:id",
  upload.single("profileImage"),
  userController.updateUserProfile
);
userRouter.delete("/deleteProfile/:id", userController.deleteUserProfile);

module.exports = userRouter;
