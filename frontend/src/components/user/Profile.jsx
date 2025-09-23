import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css"; // We will update this file next
import Navbar from "../Navbar/Navbar";
import { UnderlineNav } from "@primer/react";
import {
  BookIcon,
  RepoIcon,
  StarIcon,
  PersonIcon,
} from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap"; // Assuming this is in the same folder

const Profile = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);

  // Placeholder for pinned repositories. You would fetch this.
  const [pinnedRepos] = useState([
    {
      _id: "1",
      name: "cool-project-one",
      description: "A description of the first pinned project.",
    },
    {
      _id: "2",
      name: "another-awesome-repo",
      description: "This one showcases different skills and technologies.",
    },
  ]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:5000/userProfile/${userId}`
        );
        setUserDetails(response.data);
      } catch (err) {
        console.error("Cannot fetch user details: ", err);
      }
    };
    fetchUserDetails();
  }, [navigate]);

  if (!userDetails) {
    return (
      <>
        <Navbar />
        <div className="loading-state">Loading profile...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-page-container">
        {/* Top navigation tabs for the profile section */}
        <div className="profile-nav-container">
          <UnderlineNav aria-label="Profile sections">
            <UnderlineNav.Item aria-current="page" icon={BookIcon}>
              Overview
            </UnderlineNav.Item>
            <UnderlineNav.Item
              icon={RepoIcon}
              onClick={() => navigate(`/repo/user/${userDetails._id}`)}
            >
              Repositories
            </UnderlineNav.Item>
            <UnderlineNav.Item
              icon={StarIcon}
              onClick={() => navigate("/stars")}
            >
              Stars
            </UnderlineNav.Item>
          </UnderlineNav>
        </div>

        <div className="profile-body-container">
          {/* Left Sidebar for User Info */}
          <aside className="profile-sidebar">
            <img
              src="https://avatars.githubusercontent.com/u/1024025?v=4" // Placeholder image
              alt="User profile"
              className="profile-avatar"
            />
            <h1 className="profile-name">{userDetails.username}</h1>
            <p className="profile-username">{userDetails.email}</p>
            <button
              className="edit-profile-btn"
              onClick={() => {
                navigate(`/updateProfile/${userDetails._id}`);
              }}
            >
              Edit profile
            </button>
            <div className="profile-stats">
              <PersonIcon />
              <span className="stat">
                <strong>10</strong> followers
              </span>
              ·
              <span className="stat">
                <strong>3</strong> following
              </span>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="profile-main-content">
            <section className="profile-section">
              <h2 className="section-title">Pinned Repositories</h2>
              <div className="pinned-repos-grid">
                {pinnedRepos.map((repo) => (
                  <div key={repo._id} className="pinned-repo-card">
                    <div className="card-header">
                      <RepoIcon />
                      <Link to={`/repo/${repo._id}`} className="repo-link">
                        {repo.name}
                      </Link>
                    </div>
                    <p className="repo-description">{repo.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-section">
              <h2 className="section-title">Contribution Activity</h2>
              <div className="heatmap-container">
                <HeatMapProfile />
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default Profile;
