import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./dashboard.css";
import Navbar from "../Navbar/Navbar";
import { VscRepo, VscLock, VscStarEmpty } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";

const Dashboard = () => {
  // State for the left and right columns
  const [myRepositories, setMyRepositories] = useState([]);
  const [filteredMyRepos, setFilteredMyRepos] = useState([]);
  const [repoFilter, setRepoFilter] = useState("");
  const [starredRepos, setStarredRepos] = useState([]);

  // --- NEW: State for the dynamic activity feed ---
  const [recentRepos, setRecentRepos] = useState([]);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    // Fetch user's own repositories for the left column
    const fetchMyRepositories = async () => {
      try {
        const response = await fetch(`/api/repo/user/${userId}`);
        const data = await response.json();
        // --- THIS IS THE FIX ---
        // The API now returns the array directly, not nested in a 'repositories' object.
        setMyRepositories(data || []);
        setFilteredMyRepos(data || []);
      } catch (err) {
        console.error("Error fetching user repositories:", err);
      }
    };

    // --- NEW: Fetch recent public repos for the main feed ---
    const fetchRecentRepos = async () => {
      try {
        const response = await fetch(`/api/repo/recent`);
        const data = await response.json();
        setRecentRepos(data);
      } catch (err) {
        console.error("Error fetching recent repositories:", err);
      }
    };

    // Fetch user's starred repositories for the right column
    const fetchStarredRepositories = async () => {
      // This is still placeholder data. You'll need to build the backend for this.
      setStarredRepos([
        { _id: "123", name: "A-Starred-Repo", owner: { username: "creator" } },
      ]);
    };

    fetchMyRepositories();
    fetchRecentRepos();
    fetchStarredRepositories();
  }, [userId, navigate]);

  // Handle filtering of the user's repository list
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

  // Helper function to render repository links
  const renderRepoLink = (repo) => {
    const hasCommits = repo.commits && repo.commits.length > 0;
    const latestCommitId = hasCommits
      ? repo.commits[repo.commits.length - 1].commitId
      : null;

    if (hasCommits) {
      return (
        <Link to={`/repo/${repo._id}/tree/${latestCommitId}/`}>
          {repo.visibility ? <VscRepo /> : <VscLock />}
          <span>{repo.name}</span>
        </Link>
      );
    } else {
      // If there are no commits, render a non-clickable item
      return (
        <div className="repo-link-disabled">
          {repo.visibility ? <VscRepo /> : <VscLock />}
          <span>{repo.name}</span>
        </div>
      );
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* Left Column: Your Repositories */}
        <aside className="dashboard-sidebar left">
          <div className="repo-header">
            <h4>Your Repositories</h4>
            <Link to="/new" className="new-repo-btn">
              <FaPlus size={12} /> New
            </Link>
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
              <li key={repo._id} className="repo-list-item">
                {renderRepoLink(repo)}
              </li>
            ))}
          </ul>
        </aside>

        {/* Center Column: Recent Public Activity */}
        <main className="dashboard-main">
          <h2>Recent Activity</h2>
          <div className="activity-feed">
            {recentRepos.length > 0 ? (
              recentRepos.map(
                (repo) =>
                  // We check if repo.owner exists before rendering
                  repo.owner && (
                    <div key={repo._id} className="feed-item repo-activity">
                      <div className="feed-item-header">
                        <img
                          src={repo.owner.profileImage}
                          alt={`${repo.owner.username}'s avatar`}
                          className="feed-item-avatar"
                        />
                        <p>
                          <Link
                            to={`/profile/${repo.owner._id}`}
                            className="feed-user-link"
                          >
                            {repo.owner.username}
                          </Link>{" "}
                          created a new repository
                        </p>
                      </div>
                      <div className="feed-repo-card">
                        <div className="feed-repo-name">
                          {/* --- CORRECTED LINK FOR THE ACTIVITY FEED --- */}
                          {renderRepoLink(repo)}
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
        </main>

        {/* Right Column: Starred Repositories */}
        <aside className="dashboard-sidebar right">
          <h4>Starred Repositories</h4>
          <ul className="explore-list">
            {starredRepos.map((repo) => (
              <li key={repo._id} className="explore-list-item">
                {/* This link will need to be updated once you build the Star feature */}
                <Link to={`/repo/${repo._id}`}>
                  <VscStarEmpty />
                  <span>
                    {repo.owner.username}/{repo.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
};

export default Dashboard;
