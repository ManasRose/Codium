import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import Navbar from "../Navbar/Navbar";
import { VscRepo } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const [myRepositories, setMyRepositories] = useState([]);
  const [filteredMyRepos, setFilteredMyRepos] = useState([]);
  const [repoFilter, setRepoFilter] = useState("");
  const [starredRepos, setStarredRepos] = useState([]);
  const [recentRepos, setRecentRepos] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const reposPerPage = 5;

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Calculate Pagination Logic
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = recentRepos.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(recentRepos.length / reposPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
    if (!userId) {
      navigate("/auth");
      return;
    }

    const fetchMyRepositories = async () => {
      try {
        const response = await fetch(`/api/repo/user/${userId}`);
        const data = await response.json();
        setMyRepositories(data || []);
        setFilteredMyRepos(data || []);
      } catch (err) {
        console.error("Error fetching user repositories:", err);
      }
    };

    const fetchRecentRepos = async () => {
      try {
        // Ensure your backend returns ALL recent repos, not just 5
        const response = await fetch(`/api/repo/recent`);
        const data = await response.json();
        setRecentRepos(data);
      } catch (err) {
        console.error("Error fetching recent repositories:", err);
      }
    };

    const fetchStarredRepositories = async () => {
      try {
        const response = await fetch(`/api/user/${userId}/starred`);
        const data = await response.json();
        setStarredRepos(data);
      } catch (err) {
        console.error("Error fetching starred repositories:", err);
      }
    };

    fetchMyRepositories();
    fetchRecentRepos();
    fetchStarredRepositories();
  }, [userId, navigate]);

  useEffect(() => {
    if (repoFilter === "") {
      setFilteredMyRepos(myRepositories);
    } else {
      setFilteredMyRepos(
        myRepositories.filter((repo) =>
          repo.name.toLowerCase().includes(repoFilter.toLowerCase())
        )
      );
    }
  }, [repoFilter, myRepositories]);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* Left Sidebar - Your Repositories */}
        <aside className="dashboard-sidebar left">
          <div className="repo-header">
            <h4>Your Repositories</h4>
            <a href="/repo/create" className="new-repo-btn">
              <FaPlus size={12} /> New
            </a>
          </div>
          <input
            type="text"
            className="repo-filter-input"
            placeholder="Find a repository..."
            value={repoFilter}
            onChange={(e) => setRepoFilter(e.target.value)}
          />
          <ul className="repo-list">
            {filteredMyRepos.map((repo) => (
              <li
                key={repo._id}
                className="repo-list-item repo-link"
                onClick={() => handleRepoClick(repo._id)}
              >
                <img
                  src={
                    repo.owner?.profileImage ||
                    "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg"
                  }
                  alt={repo.owner?.username}
                  className="repo-avatar-dashboard"
                />
                <span>{repo.name}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content - Recent Activity */}
        <main className="dashboard-main">
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {currentRepos.length > 0 ? (
              currentRepos.map(
                (repo) =>
                  repo.owner && (
                    <div key={repo._id} className="feed-item">
                      <div className="feed-item-header">
                        <div className="activity-actor">
                          <img
                            src={repo.owner.profileImage}
                            alt={`${repo.owner.username}'s avatar`}
                            className="feed-item-avatar"
                          />
                          <p>
                            <span className="feed-user-link">
                              {repo.owner.username}
                            </span>{" "}
                            created a new repository
                          </p>
                        </div>
                        {repo.commits && repo.commits.length > 0 && (
                          <span className="last-commit-time">
                            Updated{" "}
                            {formatDistanceToNow(
                              new Date(
                                repo.commits[repo.commits.length - 1].timestamp
                              ),
                              { addSuffix: true }
                            )}
                          </span>
                        )}
                      </div>
                      <div className="feed-repo-card">
                        <div
                          className="feed-repo-name repo-link"
                          onClick={() => handleRepoClick(repo._id)}
                        >
                          <VscRepo />
                          <span>{repo.name}</span>
                        </div>
                        {repo.description && (
                          <p className="feed-repo-description">
                            {repo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
              )
            ) : (
              <div className="feed-item">
                <p>No recent public activity to show.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {recentRepos.length > reposPerPage && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={`pagination-btn ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </main>

        {/* Right Sidebar - Starred Repositories */}
        <aside className="dashboard-sidebar right">
          <h4>Starred Repositories</h4>
          <ul className="explore-list">
            {starredRepos.length > 0 ? (
              starredRepos.map((repo) => (
                <li
                  key={repo._id}
                  className="explore-list-item repo-link"
                  onClick={() => handleRepoClick(repo._id)}
                >
                  <img
                    src={
                      repo.owner?.profileImage ||
                      "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg"
                    }
                    alt={repo.owner?.username}
                    className="repo-avatar-dashboard"
                  />
                  <span>
                    {repo.owner?.username} / {repo.name}
                  </span>
                </li>
              ))
            ) : (
              <p className="no-starred-repos">No starred repositories yet.</p>
            )}
          </ul>
        </aside>
      </div>
    </>
  );
};

export default Dashboard;
