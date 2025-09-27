const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const { s3, S3_BUCKET } = require("../config/aws-config"); // Ensure you have this config file
const path = require("path"); // Needed for getRepoContents

const createRepository = async (req, res) => {
  const { owner, name, description, visibility } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "Repository Name is Required" });
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User Id" });
    }
    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
    });
    const result = await newRepository.save();
    res.status(201).json({
      message: "Repository Created Successfully",
      repositoryId: result._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "A repository with this name already exists." });
    }
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getAllRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find({}).populate("owner");
    res.json(repositories);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const fetchRepositoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const repository = await Repository.findById(id).populate("owner");
    res.json(repository);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const fetchRepositoryByName = async (req, res) => {
  const { name } = req.params;
  try {
    const repository = await Repository.findOne({ name }).populate("owner");
    res.json(repository);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;
  try {
    const repositories = await Repository.find({ owner: userID });
    if (!repositories) {
      return res.status(404).json({ error: "User Repositories not found!" });
    }
    res.json(repositories);
  } catch (err) {
    console.error("Error during fetching user repositories : ", err.message);
    res.status(500).send("Server error");
  }
}

const updateRepositoryById = async (req, res) => {
  const { id } = req.params;
  const { description, content } = req.body;
  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }
    repository.description = description;
    repository.content = content;
    const updatedRepository = await repository.save();
    res.json({
      message: "Repository updated successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const toggleVisibilityById = async (req, res) => {
  const { id } = req.params;
  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }
    repository.visibility = !repository.visibility;
    const updatedRepository = await repository.save();
    res.json({
      message: "Repository Visibility toggled successfully",
      repository: updatedRepository,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteRepositoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found" });
    }
    res.json({ message: "Repository deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getRecentRepositories = async (req, res) => {
  try {
    const recentRepos = await Repository.find({ visibility: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("owner");
    res.json(recentRepos);
  } catch (error) {
    console.error("Error fetching recent repositories:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getRepoContents = async (req, res) => {
  // Parameters are now accessed by index from the RegExp
  const repoId = req.params[0];
  const folderPath = req.params[1] || ""; // The folder path is the second capture group

  try {
    const repository = await Repository.findById(repoId);
    if (!repository || repository.commits.length === 0) {
      return res.status(404).json({ error: "Repository or commits not found" });
    }

    const latestCommitId =
      repository.commits[repository.commits.length - 1].commitId;
    const s3Prefix = folderPath
      ? `${repoId}/commits/${latestCommitId}/${folderPath}/`
      : `${repoId}/commits/${latestCommitId}/`;

    const params = {
      Bucket: S3_BUCKET,
      Prefix: s3Prefix,
      Delimiter: "/",
    };

    const s3Data = await s3.listObjectsV2(params).promise();

    const folders = (s3Data.CommonPrefixes || []).map((prefix) => ({
      name: path.basename(prefix.Prefix),
      type: "folder",
      key: prefix.Prefix,
    }));

    const files = (s3Data.Contents || [])
      .map((item) => ({
        name: path.basename(item.Key),
        type: "file",
        key: item.Key,
        size: item.Size,
      }))
      .filter((item) => item.name);

    res.json({ repository, contents: [...folders, ...files] });
  } catch (error) {
    console.error("Error fetching repository contents:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getRepoFileContent = async (req, res) => {
  // Parameters are now accessed by index from the RegExp
  const repoId = req.params[0];
  const commitId = req.params[1];
  const filePath = req.params[2] || ""; // The file path is the third capture group

  try {
    const s3Key = `${repoId}/commits/${commitId}/${filePath}`;
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
    };
    const s3Object = await s3.getObject(params).promise();

    res.header("Content-Type", "text/plain");
    res.send(s3Object.Body.toString("utf-8"));
  } catch (error) {
    console.error("Error fetching file content from S3:", error);
    if (error.code === "NoSuchKey") {
      return res.status(404).send("File not found in this commit.");
    }
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  getRecentRepositories,
  getRepoContents,
  getRepoFileContent,
};
