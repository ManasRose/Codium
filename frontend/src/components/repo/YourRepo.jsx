import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./YourRepo.css"; // We will create this file next
import Navbar from "../Navbar/Navbar"; // Make sure the path is correct
import { VscRepo, VscLock } from "react-icons/vsc";
import { FaPlus } from "react-icons/fa";

const YourRepo = () => {
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRepos, setFilteredRepos] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Fetch the user's repositories when the component loads
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchRepositories = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/repo/user/${userId}`
        );
        if (!response.ok) {
          // Handle cases where the user might not have repositories yet
          if (response.status === 404) {
            setRepositories([]);
            return;
          }
          throw new Error("Failed to fetch repositories");
        }
        const data = await response.json();
        setRepositories(data.repositories || []);
      } catch (err) {
        console.error("Error fetching repositories:", err);
      }
    };

    fetchRepositories();
  }, [userId, navigate]);

  // Filter the repositories list based on the search query
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredRepos(repositories);
    } else {
      const filtered = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepos(filtered);
    }
  }, [searchQuery, repositories]);

  return (
    <>
      <Navbar />
      <main className="your-repos-container">
        <header className="your-repos-header">
          <h2 className="your-repos-title">Your repositories</h2>
          <Link to="/repo/create" className="your-repos-new-btn">
            <FaPlus size={12} /> New
          </Link>
        </header>

        <div className="repo-list-controls">
          <input
            type="text"
            className="repo-list-search"
            placeholder="Find a repository..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="repo-list-body">
          {filteredRepos.length > 0 ? (
            filteredRepos.map((repo) => (
              <div key={repo._id} className="repo-list-item">
                <div className="repo-item-content">
                  {repo.visibility ? (
                    <VscRepo className="repo-item-icon" />
                  ) : (
                    <VscLock className="repo-item-icon" />
                  )}
                  <div className="repo-item-details">
                    <h3>
                      <Link to={`/repo/${repo._id}`} className="repo-item-link">
                        {repo.name}
                      </Link>
                    </h3>
                    {repo.description && (
                      <p className="repo-item-description">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`repo-item-visibility ${
                    repo.visibility ? "public" : "private"
                  }`}
                >
                  {repo.visibility ? "Public" : "Private"}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h3>No repositories found.</h3>
              <p>Get started by creating a new one.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default YourRepo;
