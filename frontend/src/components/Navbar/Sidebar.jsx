import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // 1. Import useNavigate
import "./sidebar.css";

import { GoHome, GoGitPullRequest, GoProject } from "react-icons/go";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const Sidebar = ({ isOpen, onClose }) => {
  const [userRepositories, setUserRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate(); // 2. Initialize useNavigate

  // 3. Add the navigation handler function
  const handleRepoClick = async (repoId) => {
    onClose(); // Close the sidebar first
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
    if (isOpen) {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const fetchUserRepositories = async () => {
        try {
          const response = await fetch(`/api/repo/user/${userId}`);
          const data = await response.json();
          setUserRepositories(data || []);
        } catch (err) {
          console.error("Error fetching user repositories for sidebar: ", err);
        }
      };
      fetchUserRepositories();
    }
  }, [isOpen]);

  const filteredRepositories = userRepositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <GoHome size={18} /> <span>Home</span>
          </Link>
          <Link to="/pulls" className="sidebar-link" onClick={onClose}>
            <GoGitPullRequest size={18} /> <span>Pull requests</span>
          </Link>
          <Link to="/projects" className="sidebar-link" onClick={onClose}>
            <GoProject size={18} /> <span>Projects</span>
          </Link>
        </nav>

        <hr className="sidebar-divider" />

        <div className="sidebar-repos">
          <h4>Repositories</h4>
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

          <ul className="sidebar-repo-list">
            {filteredRepositories.map((repo) => (
              <li
                key={repo._id}
                className="sidebar-repo-link"
                onClick={() => handleRepoClick(repo._id)}
              >
                <img
                  src={
                    repo.owner?.profileImage ||
                    "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg"
                  }
                  alt={repo.owner?.username}
                  className="repo-avatar"
                />
                <span>{repo.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
