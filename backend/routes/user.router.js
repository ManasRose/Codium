const express = require("express");
const userController = require("../controllers/userController");
const upload = require("../config/muter-config");
const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);
userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);
userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put(
  "/updateProfile/:id",
  upload.single("profileImage"),
  userController.updateUserProfile
);
userRouter.delete("/deleteProfile/:id", userController.deleteUserProfile);

module.exports = userRouter;
