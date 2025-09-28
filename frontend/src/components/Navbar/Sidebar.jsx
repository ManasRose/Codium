import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./sidebar.css";

// Import icons for the links
import { GoHome, GoGitPullRequest, GoProject } from "react-icons/go";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const Sidebar = ({ isOpen, onClose }) => {
  // State for user's repositories and search functionality
  const [userRepositories, setUserRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRepositories, setFilteredRepositories] = useState([]);

  // Fetch the user's repositories when the sidebar is opened
  useEffect(() => {
    // Only fetch if the sidebar is open to avoid unnecessary API calls
    if (isOpen) {
      const userId = localStorage.getItem("userId");
      if (!userId) return; // Don't fetch if there's no user ID

      const fetchUserRepositories = async () => {
        try {
          const response = await fetch(`/api/repo/user/${userId}`);
          const data = await response.json();
          setUserRepositories(data.repositories || []);
        } catch (err) {
          console.error("Error while fetching user repositories: ", err);
        }
      };

      fetchUserRepositories();
    }
  }, [isOpen]); // Re-fetch if the sidebar is opened again

  // Filter the repositories based on the search query
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredRepositories(userRepositories);
    } else {
      const filtered = userRepositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepositories(filtered);
    }
  }, [searchQuery, userRepositories]);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button onClick={onClose} className="close-btn">
            <IoClose size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link" onClick={onClose}>
            <GoHome size={18} />
            <span>Home</span>
          </Link>
          <Link to="/pulls" className="sidebar-link" onClick={onClose}>
            <GoGitPullRequest size={18} />
            <span>Pull requests</span>
          </Link>
          <Link to="/projects" className="sidebar-link" onClick={onClose}>
            <GoProject size={18} />
            <span>Projects</span>
          </Link>
        </nav>

        <hr className="sidebar-divider" />

        <div className="sidebar-repos">
          <div className="repos-header">
            <h4>Repositories</h4>
          </div>

          {/* New search input for repositories */}
          <div className="sidebar-search-container">
            <FaSearch className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Find a repository..."
              className="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ul className="repo-list">
            {/* Render the filtered list of user's repositories */}
            {filteredRepositories.map((repo) => (
              <li key={repo._id}>
                <Link
                  to={`/repo/${repo._id}`}
                  className="repo-link"
                  onClick={onClose}
                >
                  {/* You may need to adjust the avatar source based on your data */}
                  <img
                    src={
                      repo.ownerAvatar ||
                      "https://avatars.githubusercontent.com/u/1024025?v=4"
                    }
                    alt="Repo owner"
                    className="repo-avatar"
                  />
                  <span>{repo.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
