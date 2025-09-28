const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  repositories: {
    type: [{ type: Schema.Types.ObjectId, ref: "Repository" }],
    default: [],
  },
  followedUsers: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  starRepos: {
    type: [{ type: Schema.Types.ObjectId, ref: "Repository" }],
    default: [],
  },

  description: { type: String, default: "" },
  profileImage: {
    type: String,
    default:
      "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg",
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
