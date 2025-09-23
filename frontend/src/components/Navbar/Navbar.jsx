import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

// Import the necessary icons
import {
  FaGithub,
  FaBars,
  FaSearch,
  FaPlus,
  FaCaretDown,
} from "react-icons/fa";
import { VscRepo, VscInbox, VscGitPullRequest } from "react-icons/vsc";
import Sidebar from "./Sidebar";
import Dropdown from "./Dropdown";

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- New state for search functionality ---
  const [searchQuery, setSearchQuery] = useState("");
  const [allRepositories, setAllRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);
  const navigate = useNavigate();

  // --- Fetch all repositories when the component mounts ---
  useEffect(() => {
    const fetchAllRepositories = async () => {
      try {
        // This endpoint is from your Dashboard.jsx
        const response = await fetch(`http://localhost:5000/repo/all`);
        const data = await response.json();
        setAllRepositories(data);
      } catch (err) {
        console.error("Error while fetching all repositories: ", err);
      }
    };
    fetchAllRepositories();
  }, []);

  // --- Filter repositories based on the search query ---
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const filtered = allRepositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allRepositories]);

  // --- Handle clicks outside the search to close the dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResultClick = (repoId) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);
    // Navigate to the repository page. You will need to create this route.
    navigate(`/repo/${repoId}`);
  };

  const userProfilePic = "https://avatars.githubusercontent.com/u/1024025?v=4";

  const handleSignOut = () => {
    console.log("User signed out");
  };

  return (
    <>
      <header className="navbar-container">
        <div className="navbar-left">
          <div className="tooltip-container" data-tooltip="Navigation menu">
            <button className="navbar-icon-btn" onClick={toggleSidebar}>
              <FaBars size={20} />
            </button>
          </div>
          <Link to="/" className="navbar-logo">
            <FaGithub size={32} />
          </Link>
          <Link to="/" className="navbar-title-link">
            <span className="navbar-title">Dashboard</span>
          </Link>
        </div>

        <div className="navbar-right">
          {/* --- Updated Search Bar --- */}
          <div className="search-wrapper" ref={searchWrapperRef}>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Type / to search"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
            </div>
            {isSearchFocused && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((repo) => (
                  <div
                    key={repo._id}
                    className="search-result-item"
                    onClick={() => handleResultClick(repo._id)}
                  >
                    {repo.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="navbar-actions">
            <Dropdown
              trigger={
                <div className="tooltip-container" data-tooltip="Create new...">
                  <button className="navbar-icon-btn plus-caret-btn">
                    <FaPlus className="plus-icon" />
                    <FaCaretDown className="caret-icon" />
                  </button>
                </div>
              }
            >
              <Link to="/new" className="dropdown-item">
                New repository
              </Link>
            </Dropdown>

            <div className="tooltip-container" data-tooltip="Your repositories">
              <button className="navbar-icon-btn">
                <VscRepo size={20} />
              </button>
            </div>
            <div className="tooltip-container" data-tooltip="Pull requests">
              <button className="navbar-icon-btn">
                <VscGitPullRequest size={20} />
              </button>
            </div>
            <div className="tooltip-container" data-tooltip="Inbox">
              <button className="navbar-icon-btn">
                <VscInbox size={20} />
              </button>
            </div>
          </div>

          <Dropdown
            trigger={
              <div
                className="tooltip-container"
                data-tooltip="View profile and more"
              >
                <img
                  src={userProfilePic}
                  alt="User Profile"
                  className="profile-pic"
                />
              </div>
            }
          >
            <div className="dropdown-header">
              Signed in as <strong>ManasRose</strong>
            </div>
            <div className="dropdown-divider"></div>
            <Link to="/profile" className="dropdown-item">
              Your profile
            </Link>
            <Link to="/profile/repositories" className="dropdown-item">
              Your repositories
            </Link>
            <Link to="/profile/stars" className="dropdown-item">
              Your stars
            </Link>
            <div className="dropdown-divider"></div>
            <Link to="/settings" className="dropdown-item">
              Settings
            </Link>
            <button onClick={handleSignOut} className="dropdown-item">
              Sign out
            </button>
          </Dropdown>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
    </>
  );
};

export default Navbar;
