import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { VscRepo } from "react-icons/vsc";
import { formatDistanceToNow } from "date-fns";
import "./YourRepo.css";

const StarredRepo = () => {
  const [starredRepos, setStarredRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const { userID } = useParams();
  const navigate = useNavigate();

  const currentUserId = userID || localStorage.getItem("userId");

  const handleRepoClick = async (repoId) => {
    try {
      const response = await fetch(`/api/repo/${repoId}/contents/`);
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
    const fetchStarredRepos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/${currentUserId}/starred`);
        if (!response.ok)
          throw new Error("Failed to fetch starred repositories");
        const data = await response.json();
        setStarredRepos(data);
      } catch (error) {
        console.error("Error fetching starred repositories:", error);
        setStarredRepos([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) fetchStarredRepos();
  }, [currentUserId]);

  const filteredRepos = starredRepos.filter((repo) =>
    repo.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="your-repo-container">
        <div className="page-header">
          <h1>Starred repositories</h1>
        </div>

        <input
          type="text"
          placeholder="Search starred repositories..."
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
                        <span>
                          {repo.owner?.username
                            ? `${repo.owner.username} / `
                            : ""}
                          {repo.name}
                        </span>
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
              <h3>No starred repositories found.</h3>
              <p>Star repositories to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StarredRepo;
