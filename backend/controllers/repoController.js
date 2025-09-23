const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");

const createRepository = async (req, res) => {
  const { owner, name, content, description, visibility } = req.body;
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
      content,
      visibility,
      owner,
    });
    const result = await newRepository.save();
    res.status(201).json({
      message: "Repository Created Successfully",
      repositoryId: result._id,
    });
  } catch (error) {
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
    const repository = await Repository.find({ name }).populate("owner");
    res.json(repository);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

async function fetchRepositoriesForCurrentUser(req, res) {
  console.log(req.params);
  const { userID } = req.params;

  try {
    const repositories = await Repository.find({ owner: userID });

    if (!repositories || repositories.length == 0) {
      return res.status(404).json({ error: "User Repositories not found!" });
    }
    console.log(repositories);
    res.json({ message: "Repositories found!", repositories });
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
};
