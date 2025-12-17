import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

// Import the necessary icons
import { FaBars, FaSearch, FaPlus, FaCaretDown, FaNpm } from "react-icons/fa";
import { VscRepo, VscInbox, VscGitPullRequest } from "react-icons/vsc";
import Sidebar from "./Sidebar";
import Dropdown from "./Dropdown";
import codiumLogo from "../../assets/github-mark-white.svg";

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  //State for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [allRepositories, setAllRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);
  const navigate = useNavigate();

  //State to hold dynamic user data
  const [userProfilePic, setUserProfilePic] = useState(
    "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg"
  );
  const [username, setUsername] = useState("User");

  const userId = localStorage.getItem("userId");

  //Fetch user's profile data to get the image URL and username
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await fetch(`/api/userProfile/${userId}`);
          const userData = await response.json();
          if (userData) {
            if (userData.profileImage) {
              setUserProfilePic(userData.profileImage);
            }
            if (userData.username) {
              setUsername(userData.username);
            }
          }
        } catch (err) {
          console.error("Failed to fetch user profile for navbar:", err);
        }
      }
    };
    fetchUserProfile();
  }, [userId]);

  //Fetch all repositories when the component mounts
  useEffect(() => {
    const fetchAllRepositories = async () => {
      try {
        const response = await fetch(`/api/repo/all`);
        const data = await response.json();
        setAllRepositories(data);
      } catch (err) {
        console.error("Error while fetching all repositories: ", err);
      }
    };
    fetchAllRepositories();
  }, []); //This is an efficient "cache"

  //Filter repositories based on the search query
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

  //Handle clicks outside the search to close the dropdown
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

  //Function to handle clicking a search result
  const handleResultClick = async (repoId) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchFocused(false);

    try {
      // Fetch repo details to find the latest commit ID
      const response = await fetch(`/api/repo/${repoId}/contents/`);
      const data = await response.json();

      if (
        response.ok &&
        data.repository &&
        data.repository.commits.length > 0
      ) {
        const latestCommitId =
          data.repository.commits[data.repository.commits.length - 1].commitId;
        // Navigate to the full, correct URL for the repo page
        navigate(`/repo/${repoId}/tree/${latestCommitId}/`);
      } else {
        // Fallback for an empty repository with no commits
        console.warn("Repository has no commits.");
        // You might want a specific route or UI for empty repos
        navigate(`/repo/${repoId}/tree/main/`);
      }
    } catch (error) {
      console.error("Failed to fetch latest commit for navigation:", error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/auth"); // Navigate to login page
  };

  return (
    <>
      <header className="navbar-container">
        <div className="navbar-left">
          <div className="tooltip-container" data-tooltip="Menu">
            <button className="navbar-icon-btn" onClick={toggleSidebar}>
              <FaBars size={20} />
            </button>
          </div>
          <Link to="/" className="navbar-logo">
            <img
              src={codiumLogo}
              alt="Codium Logo"
              className="navbar-logo-img"
            />
          </Link>
          <Link to="/" className="navbar-title-link">
            <span className="navbar-title">Dashboard</span>
          </Link>
        </div>

        <div className="navbar-center">
          <a
            href="https://www.npmjs.com/package/@manasrose/codium?activeTab=readme"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-npm-link"
          >
            <FaNpm size={24} />
            <span>View on npm</span>
          </a>
        </div>

        <div className="navbar-right">
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
              <Link to="/repo/create" className="dropdown-item">
                New repository
              </Link>
            </Dropdown>

            <div className="tooltip-container" data-tooltip="Your repositories">
              <Link to={`/repo/user/${userId}`} className="navbar-icon-btn">
                <VscRepo size={20} />
              </Link>
            </div>
            <div className="tooltip-container" data-tooltip="Pull requests">
              <Link to="/pulls" className="navbar-icon-btn">
                <VscGitPullRequest size={20} />
              </Link>
            </div>
            <div className="tooltip-container" data-tooltip="Inbox">
              <Link to="/inbox" className="navbar-icon-btn">
                <VscInbox size={20} />
              </Link>
            </div>
          </div>

          <Dropdown
            trigger={
              <div className="tooltip-container" data-tooltip="Profile">
                <img
                  src={userProfilePic}
                  alt="User Profile"
                  className="profile-pic"
                />
              </div>
            }
          >
            <div className="dropdown-header">
              Signed in as <strong>{username}</strong>
            </div>
            <div className="dropdown-divider"></div>
            <Link to="/profile" className="dropdown-item">
              Your profile
            </Link>
            <Link to={`/repo/user/${userId}`} className="dropdown-item">
              Your repositories
            </Link>
            <Link to="/repo/starred" className="dropdown-item">
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
