const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

const createIssue = async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    const issue = new Issue({
      title: title,
      description: description,
      repository: id,
    });
    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const updateIssueById = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      res.status(201).json({ error: "Issue not found" });
    }
    issue.title = title;
    issue.description = description;
    issue.status = status;
    await issue.save();
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const deleteIssueById = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await Issue.findByIdAndDelete(id);
    if (!issue) {
      res.status(201).json({ error: "Issue not found" });
    }
    res.status(201).json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const getAllIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const issues = await Issue.find({ repository: id });
    if (!issues) {
      res.status(201).json({ error: "Issues not found" });
    }
    res.status(201).json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const getIssueById = async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      res.status(201).json({ error: "Issue not found" });
    }
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
