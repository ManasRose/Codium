import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { FaCaretDown } from "react-icons/fa";
import Dropdown from "../Navbar/Dropdown";
import { VscCloudDownload } from "react-icons/vsc";

// Styles and Components
import "./RepoPage.css";
import Navbar from "../Navbar/Navbar";
import FileUpload from "./FileUpload";

// Icons
import {
  VscRepo,
  VscFolder,
  VscFile,
  VscCode,
  VscIssues,
  VscGitPullRequest,
  VscStarEmpty,
  VscStarFull,
} from "react-icons/vsc";

const RepoPage = () => {
  const { repoId } = useParams();
  const currentPath = useParams()["*"] || "";
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [repoDetails, setRepoDetails] = useState(null);
  const [contents, setContents] = useState([]);
  const [latestCommit, setLatestCommit] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);

  const refreshRepoContents = () => {
    navigate(0);
  };

  useEffect(() => {
    const fetchRepoData = async () => {
      setIsLoading(true);
      setReadmeContent("");
      try {
        const response = await axios.get(
          `/api/repo/${repoId}/contents/${currentPath}`
        );
        const { repository, contents } = response.data;
        setRepoDetails(repository);
        setContents(contents || []);
        setStarCount(repository.starCount);

        if (userId) {
          const starredResponse = await axios.get(
            `/api/user/${userId}/starred`
          );
          const isRepoStarred = starredResponse.data.some(
            (repo) => repo._id === repoId
          );
          setIsStarred(isRepoStarred);
        }

        if (repository && repository.commits.length > 0) {
          const lastCommit = repository.commits[repository.commits.length - 1];
          setLatestCommit(lastCommit);

          const readmeFile = contents.find(
            (item) => item.name.toLowerCase() === "readme.md"
          );
          if (readmeFile) {
            const commitPrefix = `${repoId}/commits/${lastCommit.commitId}/`;
            const relativeReadmePath = readmeFile.key.replace(commitPrefix, "");
            fetchReadmeContent(relativeReadmePath, lastCommit.commitId);
          }
        }
      } catch (err) {
        console.error("Error fetching repository contents:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReadmeContent = async (readmePath, commitId) => {
      try {
        const readmeResponse = await axios.get(
          `/api/repo/${repoId}/commit/${commitId}/file/${readmePath}`
        );
        setReadmeContent(readmeResponse.data);
      } catch (err) {
        console.error("Error fetching README content:", err);
      }
    };

    if (repoId) {
      fetchRepoData();
    }
  }, [repoId, currentPath, userId]);

  const handleStarClick = async () => {
    if (!userId) return navigate("/auth");
    try {
      const response = await axios.patch(`/api/repo/${repoId}/toggle-star`, {
        userId,
      });
      setIsStarred(response.data.isStarred);
      setStarCount(response.data.starCount);
    } catch (error) {
      console.error("Failed to toggle star", error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="loading-state">Loading repository...</div>
      </>
    );
  }
  if (!repoDetails) {
    return (
      <>
        <Navbar />
        <div className="loading-state">Repository not found.</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="repo-page-container">
        <header className="repo-page-header">
          <div className="repo-header-top">
            <h2 className="repo-title">
              <VscRepo />
              <Link
                to={`/profile/${repoDetails.owner._id}`}
                className="owner-link"
              >
                {repoDetails.owner.username}
              </Link>
              <span className="separator">/</span>
              <Link to={`/repo/${repoDetails._id}`} className="repo-name-link">
                {repoDetails.name}
              </Link>
            </h2>
            <div className="repo-actions">
              {latestCommit && (
                <Dropdown
                  trigger={
                    <button className="action-btn code-btn">
                      <VscCode /> Code <FaCaretDown />
                    </button>
                  }
                >
                  <a
                    href={`/api/repo/${repoId}/commit/${latestCommit.commitId}/zip`}
                    className="dropdown-item"
                    download={`${repoDetails.name}.zip`}
                  >
                    <VscCloudDownload /> Download ZIP
                  </a>
                </Dropdown>
              )}
              <button onClick={handleStarClick} className="action-btn">
                {isStarred ? <VscStarFull /> : <VscStarEmpty />}
                <span>{isStarred ? "Unstar" : "Star"}</span>
                {starCount > 0 && (
                  <span className="star-count">{starCount}</span>
                )}
              </button>
              <button className="action-btn">Fork</button>
            </div>
          </div>
          <nav className="repo-nav-tabs">
            <Link to="#" className="nav-tab active">
              <VscCode /> Code
            </Link>
            <Link to="#" className="nav-tab">
              <VscIssues /> Issues
            </Link>
            <Link to="#" className="nav-tab">
              <VscGitPullRequest /> Pull Requests
            </Link>
          </nav>
        </header>

        <div className="repo-page-layout">
          <main className="repo-main-content">
            <div className="file-browser">
              <div className="file-browser-header">
                <div className="commit-info">
                  <strong>{repoDetails.owner.username}</strong>
                  <p className="commit-message">{latestCommit?.message}</p>
                </div>
                <div className="commit-meta">
                  {latestCommit && (
                    <>
                      <p className="commit-id">Latest commit:</p>
                      <p className="commit-time">
                        {formatDistanceToNow(new Date(latestCommit.timestamp))}{" "}
                        ago
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="file-list">
                <div className="file-list-row header-row">
                  <div className="file-name-col">{repoDetails.name}</div>
                  <div className="file-commit-col">
                    {repoDetails.description}
                  </div>
                  <div className="file-age-col">
                    {formatDistanceToNow(new Date(repoDetails.createdAt))} ago
                  </div>
                </div>

                {contents.length > 0 && latestCommit ? (
                  <>
                    {currentPath && (
                      <div className="file-list-row">
                        <div className="file-name-col">
                          <Link
                            to={`/repo/${repoId}/tree/${
                              latestCommit.commitId
                            }/${currentPath.substring(
                              0,
                              currentPath.lastIndexOf("/")
                            )}`}
                            className="file-link parent-dir"
                          >
                            ..
                          </Link>
                        </div>
                      </div>
                    )}
                    {contents.map((item) => {
                      const commitPrefix = `${repoId}/commits/${latestCommit.commitId}/`;
                      const relativePath = item.key.replace(commitPrefix, "");
                      return (
                        <div key={item.key} className="file-list-row">
                          <div className="file-name-col">
                            {item.type === "folder" ? (
                              <>
                                <VscFolder className="file-icon folder" />
                                <Link
                                  to={`/repo/${repoId}/tree/${latestCommit.commitId}/${relativePath}`}
                                  className="file-link"
                                >
                                  {item.name}
                                </Link>
                              </>
                            ) : (
                              <>
                                <VscFile className="file-icon" />
                                <Link
                                  to={`/repo/${repoId}/blob/${latestCommit.commitId}/${relativePath}`}
                                  className="file-link"
                                >
                                  {item.name}
                                </Link>
                              </>
                            )}
                          </div>
                          <div className="file-commit-col">
                            {latestCommit?.message}
                          </div>
                          <div className="file-age-col">
                            {formatDistanceToNow(
                              new Date(latestCommit.timestamp)
                            )}{" "}
                            ago
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="empty-repo-container">
                    <h3>This repository is empty.</h3>
                    {!currentPath ? (
                      <FileUpload
                        repoId={repoId}
                        onUploadComplete={refreshRepoContents}
                      />
                    ) : (
                      <p>This folder is empty.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {readmeContent && (
              <div className="readme-container">
                <h3>README.md</h3>
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {readmeContent}
                  </ReactMarkdown>
                </article>
              </div>
            )}
          </main>

          <aside className="repo-sidebar">
            <div className="sidebar-section">
              <h4>About</h4>
              <p className="repo-description">
                {repoDetails.description || "No description provided."}
              </p>
            </div>
            <div className="sidebar-section">
              <h4>Statistics</h4>
              <ul className="stats-list">
                <li>
                  <strong>{repoDetails.commits.length}</strong> Commits
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default RepoPage;
