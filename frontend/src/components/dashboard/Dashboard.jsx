import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./dashboard.css";
import Navbar from "../Navbar/Navbar"; // Assuming correct path
import { VscRepo, VscLock, VscStarEmpty } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";

const Dashboard = () => {
  // State for all the data needed on the dashboard
  const [myRepositories, setMyRepositories] = useState([]);
  const [filteredMyRepos, setFilteredMyRepos] = useState([]);
  const [repoFilter, setRepoFilter] = useState("");
  const [exploreRepos, setExploreRepos] = useState([]);
  const [starredRepos, setStarredRepos] = useState([]);
  // You would need a new endpoint for an activity feed
  const [activityFeed, setActivityFeed] = useState([
    {
      id: 1,
      user: "demo-user",
      action: "created repository",
      repo: "cool-project",
    },
    { id: 2, user: "another-dev", action: "starred", repo: "your-repo" },
  ]); // Placeholder data

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Fetch all necessary data when the component mounts
  useEffect(() => {
    if (!userId) {
      navigate("/login"); // Redirect if not logged in
      return;
    }

    // Fetch user's own repositories
    const fetchMyRepositories = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/repo/user/${userId}`
        );
        const data = await response.json();
        setMyRepositories(data.repositories || []);
        setFilteredMyRepos(data.repositories || []);
      } catch (err) {
        console.error("Error fetching user repositories:", err);
      }
    };

    // Fetch public repositories for the "Explore" section
    const fetchExploreRepositories = async () => {
      try {
        const response = await fetch(`http://localhost:5000/repo/all`); // Assuming this gets all public
        const data = await response.json();
        // Filter out own repos and limit the list
        setExploreRepos(
          data.filter((repo) => repo.owner !== userId).slice(0, 5)
        );
      } catch (err) {
        console.error("Error fetching explore repositories:", err);
      }
    };

    // Fetch user's starred repositories
    const fetchStarredRepositories = async () => {
      // NOTE: You'll need a backend endpoint for this, e.g., /user/:userId/stars
      // For now, we'll simulate it.
      setStarredRepos([
        { _id: "123", name: "A-Starred-Repo", owner: { username: "creator" } },
      ]);
    };

    fetchMyRepositories();
    fetchExploreRepositories();
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

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        {/* Left Column: Your Repositories */}
        <aside className="dashboard-sidebar left">
          <div className="repo-header">
            <h4>Your Repositories</h4>
            <Link to="/repo/create" className="new-repo-btn">
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
                <Link to={`/repo/${repo._id}`}>
                  {repo.visibility ? <VscRepo /> : <VscLock />}
                  <span>{repo.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Center Column: Activity Feed */}
        <main className="dashboard-main">
          <h2>Activity Feed</h2>
          <div className="activity-feed">
            {activityFeed.map((item) => (
              <div key={item.id} className="feed-item">
                <p>
                  <strong>{item.user}</strong> {item.action}{" "}
                  <strong>{item.repo}</strong>
                </p>
                <span className="feed-item-time">2 hours ago</span>
              </div>
            ))}
          </div>
        </main>

        {/* Right Column: Discovery */}
        <aside className="dashboard-sidebar right">
          <h4>Starred Repositories</h4>
          <ul className="explore-list">
            {starredRepos.map((repo) => (
              <li key={repo._id} className="explore-list-item">
                <Link to={`/repo/${repo._id}`}>
                  <VscStarEmpty />
                  <span>
                    {repo.owner.username}/{repo.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <hr className="sidebar-divider" />

          <h4>Explore</h4>
          <ul className="explore-list">
            {exploreRepos.map((repo) => (
              <li key={repo._id} className="explore-list-item">
                <Link to={`/repo/${repo._id}`}>
                  <VscRepo />
                  <span>{repo.name}</span>
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
