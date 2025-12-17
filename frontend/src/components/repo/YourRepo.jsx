import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { VscRepo } from "react-icons/vsc";
import { formatDistanceToNow } from "date-fns"; // We'll use this for timestamps
import "./YourRepo.css";

const YourRepo = () => {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(""); // State for the filter input
  const { userID } = useParams();
  const navigate = useNavigate();

  const handleRepoClick = async (repoId) => {
    try {
      const response = await fetch(
        `https://codium-backend.onrender.com/api/repo/${repoId}/contents/`
      );
      const data = await response.json();
      if (
        response.ok &&
        data.repository &&
        data.repository.commits.length > 0
      ) {
        const latestCommitId =
          data.repository.commits[data.repository.commits.length - 1].commitId;
        navigate(`/repo/${repoId}/tree/${latestCommitId}/`);
      } else {
        navigate(`/repo/${repoId}/tree/main/`);
      }
    } catch (error) {
      console.error("Failed to fetch repo details for navigation:", error);
    }
  };

  useEffect(() => {
    const fetchUserRepos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://codium-backend.onrender.com/api/repo/user/${userID}`
        );
        if (!response.ok) throw new Error("Failed to fetch repositories");
        const data = await response.json();
        setRepositories(data);
      } catch (error) {
        console.error("Error fetching user repositories:", error);
        setRepositories([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (userID) fetchUserRepos();
  }, [userID]);

  // Filter repositories based on the input field
  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="your-repo-container">
        <div className="page-header">
          <h1>Your repositories</h1>
          <button
            onClick={() => navigate("/repo/create")}
            className="new-repo-btn"
          >
            New
          </button>
        </div>

        <input
          type="text"
          placeholder="Find a repository..."
          className="filter-input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <div className="repo-list-container">
          {isLoading ? (
            <p>Loading...</p>
          ) : filteredRepos.length > 0 ? (
            <ul>
              {filteredRepos.map((repo) => (
                <li key={repo._id} className="repo-item">
                  <div className="repo-info">
                    <div className="repo-title-line">
                      <div
                        onClick={() => handleRepoClick(repo._id)}
                        className="repo-item-link"
                      >
                        <VscRepo />
                        <span>{repo.name}</span>
                      </div>
                      <span
                        className={`visibility-badge ${
                          repo.visibility ? "public" : "private"
                        }`}
                      >
                        {repo.visibility ? "Public" : "Private"}
                      </span>
                    </div>
                    <p className="repo-item-description">{repo.description}</p>
                  </div>
                  <div className="repo-meta">
                    <span>
                      Updated{" "}
                      {formatDistanceToNow(new Date(repo.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-repos-found">
              <h3>No repositories found.</h3>
              <p>Get started by creating a new one.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default YourRepo;
