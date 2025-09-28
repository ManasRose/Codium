import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Styles and Components
import "./RepoPage.css";
import Navbar from "../Navbar/Navbar";

// Icons
import {
  VscRepo,
  VscFolder,
  VscFile,
  VscCode,
  VscIssues,
  VscGitPullRequest,
  VscStarEmpty,
} from "react-icons/vsc";

const RepoPage = () => {
  const { repoId } = useParams();
  const currentPath = useParams()["*"] || "";

  const [repoDetails, setRepoDetails] = useState(null);
  const [contents, setContents] = useState([]);
  const [latestCommit, setLatestCommit] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      setIsLoading(true);
      setReadmeContent("");
      try {
        const response = await axios.get(
          `/api/repo/${repoId}/contents/${currentPath}`
        );
        const { repository, contents } = response.data;
        setRepoDetails(repository);
        setContents(contents || []);

        if (repository && repository.commits.length > 0) {
          const lastCommit = repository.commits[repository.commits.length - 1];
          setLatestCommit(lastCommit);

          const readmeFile = contents.find(
            (item) => item.name.toLowerCase() === "readme.md"
          );

          // --- FIX #1: Use the shorter path to fetch the README ---
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
      fetchContents();
    }
  }, [repoId, currentPath]);

  if (isLoading) {
    return <div className="loading-state">Loading...</div>;
  }
  if (!repoDetails) {
    return <div className="loading-state">Repo not found.</div>;
  }

  return (
    <>
      <Navbar />
      <div className="repo-page-container">
        {/* Your original header design is preserved */}
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
              <button className="action-btn">
                <VscStarEmpty /> Star
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
                  <p className="commit-id">Latest commit:</p>
                  <p className="commit-time">
                    {latestCommit
                      ? formatDistanceToNow(new Date(latestCommit.timestamp))
                      : ""}{" "}
                    ago
                  </p>
                </div>
              </div>

              <div className="file-list">
                {/* Your original header row design is preserved */}
                <div className="file-list-row header-row">
                  <div className="file-name-col">{repoDetails.name}</div>
                  <div className="file-commit-col">
                    {repoDetails.description}
                  </div>
                  <div className="file-age-col">{repoDetails.createdAt}</div>
                </div>

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

                {/* --- FIX #2: Use the shorter path for file and folder links --- */}
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
                        {formatDistanceToNow(new Date(latestCommit.timestamp))}{" "}
                        ago
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* --- README Section --- */}
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

          {/* ============================================================= */}
          {/* ======================= SIDEBAR ============================= */}
          {/* ============================================================= */}
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
                  {/* This is now dynamic based on your schema */}
                  <strong>{repoDetails.commits.length}</strong> Commits
                </li>
                {/* Hardcoded "1 Branch" removed */}
              </ul>
            </div>
            {/* Hardcoded "Languages" section removed */}
          </aside>
        </div>
      </div>
    </>
  );
};

export default RepoPage;
