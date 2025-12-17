const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const { s3, S3_BUCKET } = require("../config/aws-config");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");

const {
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const createRepository = async (req, res) => {
  const { owner, name, description, visibility } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: "Repository Name is Required" });
    }
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      // Validate owner ID from request body through mongoose
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
    const repositories = await Repository.find({ owner: userID }).populate(
      "owner"
    );
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
      .populate("owner");
    res.json(recentRepos);
  } catch (error) {
    console.error("Error fetching recent repositories:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getRepoContents = async (req, res) => {
  const repoId = req.params[0];
  const folderPath = req.params[1] || "";

  try {
    const repository = await Repository.findById(repoId).populate("owner");
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    if (repository.commits.length === 0) {
      return res.json({ repository, contents: [] });
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
    const s3Data = await s3.send(new ListObjectsV2Command(params));

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
  const repoId = req.params[0];
  const commitId = req.params[1];
  const filePath = req.params[2] || "";

  try {
    const s3Key = `${repoId}/commits/${commitId}/${filePath}`;
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
    };
    const s3Object = await s3.send(new GetObjectCommand(params));
    const bodyContents = await s3Object.Body.transformToString("utf-8");

    res.header("Content-Type", "text/plain");
    res.send(bodyContents);
  } catch (error) {
    console.error("Error fetching file content from S3:", error);
    if (error.name === "NoSuchKey") {
      // Note: error.code becomes error.name in v3
      return res.status(404).send("File not found in this commit.");
    }
    res.status(500).send("Internal Server Error");
  }
};

const uploadFilesToRepo = async (req, res) => {
  const { repoId } = req.params;
  const { message } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found." });
    }

    const newCommitId = uuidv4();
    const uploadPromises = files.map((file) => {
      const s3Key = `${repoId}/commits/${newCommitId}/${file.originalname}`;
      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      // Create and send the command for each file.
      return s3.send(new PutObjectCommand(params));
    });

    await Promise.all(uploadPromises);

    const newCommit = {
      commitId: newCommitId,
      message: message || `Uploaded ${files.length} file(s)`,
      timestamp: new Date(),
    };

    repository.commits.push(newCommit);
    await repository.save();

    res.status(200).json({
      message: "Files uploaded and commit created successfully.",
      commit: newCommit,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).send("Internal Server Error");
  }
};

const downloadRepoAsZip = async (req, res) => {
  const { repoId, commitId } = req.params;

  try {
    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).send("Repository not found");
    }

    const s3Prefix = `${repoId}/commits/${commitId}/`;

    res.attachment(`${repository.name}.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      throw err;
    });
    archive.pipe(res);

    const listParams = { Bucket: S3_BUCKET, Prefix: s3Prefix };
    const listedObjects = await s3.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      archive.finalize();
      return;
    }
    for (const file of listedObjects.Contents) {
      // Get the object from S3. The Body will be a readable stream.
      const s3Object = await s3.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: file.Key })
      );
      const relativePath = file.Key.replace(s3Prefix, "");

      if (relativePath) {
        // Append the stream from the S3 response Body directly to the archive.
        archive.append(s3Object.Body, { name: relativePath });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error("Error creating zip archive:", error);
    res.status(500).send("Error creating zip file.");
  }
};

const toggleStarRepo = async (req, res) => {
  const { repoId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const repo = await Repository.findById(repoId);
    const user = await User.findById(userId);

    if (!repo || !user) {
      return res.status(404).json({ error: "Repository or User not found." });
    }

    const isStarred = user.starRepos.includes(repoId);

    if (isStarred) {
      user.starRepos.pull(repoId);
      repo.starCount -= 1;
    } else {
      user.starRepos.push(repoId);
      repo.starCount += 1;
    }

    await user.save();
    await repo.save();

    res.json({
      isStarred: !isStarred,
      starCount: repo.starCount,
    });
  } catch (error) {
    console.error("Error toggling star:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addCommitToRepo = async (req, res) => {
  const { repoId } = req.params;
  const { commitId, message, timestamp } = req.body;

  try {
    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found." });
    }

    const newCommit = { commitId, message, timestamp };
    repository.commits.push(newCommit);
    await repository.save();

    res.status(200).json({ message: "Commit added successfully.", repository });
  } catch (error) {
    console.error("Error adding commit to repo:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
  uploadFilesToRepo,
  downloadRepoAsZip,
  toggleStarRepo,
  addCommitToRepo,
};
