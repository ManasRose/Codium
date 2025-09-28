const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const { s3, S3_BUCKET } = require("../config/aws-config"); // Ensure you have this config file
const path = require("path"); // Needed for getRepoContents
const { v4: uuidv4 } = require("uuid");
const archiver = require("archiver");

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
    // Add .populate("owner") to include the full user object
    const repositories = await Repository.find({ owner: userID }).populate(
      "owner"
    );

    // The check for !repositories is not needed, as .find() returns an empty array []
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
  // The logic to get repoId might differ based on your regex route,
  // this assumes it's available as req.params[0] or similar.
  // For clarity, let's assume you've extracted it into a variable.
  const repoId = req.params[0];
  const folderPath = req.params[1] || "";

  try {
    const repository = await Repository.findById(repoId).populate("owner");

    // First, check if the repository exists at all
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }

    // --- THIS IS THE KEY CHANGE ---
    // If the repository exists but has NO commits, send a success
    // response with the repo data and an empty contents array.
    if (repository.commits.length === 0) {
      return res.json({ repository, contents: [] });
    }

    // If there are commits, proceed as normal
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
      .filter((item) => item.name); // Filter out empty names from placeholder folders

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

    // Create an array of promises for all the S3 uploads
    const uploadPromises = files.map((file) => {
      const s3Key = `${repoId}/commits/${newCommitId}/${file.originalname}`;
      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file.buffer, // Use the buffer from multer's memory storage
        ContentType: file.mimetype,
      };
      return s3.upload(params).promise();
    });

    // Wait for all files to be uploaded to S3
    await Promise.all(uploadPromises);

    // Create the new commit object
    const newCommit = {
      commitId: newCommitId,
      message: message || `Uploaded ${files.length} file(s)`,
      timestamp: new Date(),
    };

    // Add the new commit to the repository's commits array
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

    // 1. Set the headers to tell the browser to download the file
    res.attachment(`${repository.name}.zip`);

    // 2. Create a zip archive stream
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    // Good practice to catch warnings and errors during archiving
    archive.on("warning", (err) => {
      if (err.code === "ENOENT") console.warn(err);
      else throw err;
    });
    archive.on("error", (err) => {
      throw err;
    });

    // 3. Pipe the archive data to the response
    archive.pipe(res);

    // 4. Find all files for the commit in S3
    const listParams = { Bucket: S3_BUCKET, Prefix: s3Prefix };
    const listedObjects = await s3.listObjectsV2(listParams).promise();

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      archive.finalize();
      return;
    }

    // 5. For each file, stream it from S3 and append it to the archive
    for (const file of listedObjects.Contents) {
      const s3Stream = s3
        .getObject({ Bucket: S3_BUCKET, Key: file.Key })
        .createReadStream();
      const relativePath = file.Key.replace(s3Prefix, "");

      // Skip empty directory placeholders from S3
      if (relativePath) {
        archive.append(s3Stream, { name: relativePath });
      }
    }

    // 6. Finalize the archive (this sends the end of the stream to the client)
    await archive.finalize();
  } catch (error) {
    console.error("Error creating zip archive:", error);
    res.status(500).send("Error creating zip file.");
  }
};
const toggleStarRepo = async (req, res) => {
  const { repoId } = req.params;
  const { userId } = req.body; // The frontend will send the user's ID

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const repo = await Repository.findById(repoId);
    const user = await User.findById(userId);

    if (!repo || !user) {
      return res.status(404).json({ error: "Repository or User not found." });
    }

    // Check if the user has already starred this repository
    const isStarred = user.starRepos.includes(repoId);

    if (isStarred) {
      // If already starred, UNSTAR it
      user.starRepos.pull(repoId);
      repo.starCount -= 1;
    } else {
      // If not starred, STAR it
      user.starRepos.push(repoId);
      repo.starCount += 1;
    }

    // Save both updated documents
    await user.save();
    await repo.save();

    // Send a helpful response back to the frontend
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
  const { commitId, message, timestamp } = req.body; // Get commit data from request

  try {
    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found." });
    }

    // You could add a check here to ensure req.user.id matches repository.owner

    const newCommit = { commitId, message, timestamp };
    repository.commits.push(newCommit); // Add the new commit to the array
    await repository.save(); // Save the updated document

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
