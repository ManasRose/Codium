const mongoose = require("mongoose");
const { required } = require("yargs");
const { Schema } = mongoose;

const RepoSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    content: [{ type: String, default: "" }],
    visibility: { type: Boolean },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commits: [
      {
        commitId: { type: String, required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Repository = mongoose.model("Repository", RepoSchema);
module.exports = Repository;
