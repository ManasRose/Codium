import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar/Navbar";
import { UnderlineNav } from "@primer/react";
import {
  BookIcon,
  RepoIcon,
  StarIcon,
  PersonIcon,
} from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";

const Profile = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(
          `https://codium-backend.onrender.com/api/userProfile/${userId}`
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
              onClick={() => navigate("/repo/starred")}
            >
              Stars
            </UnderlineNav.Item>
          </UnderlineNav>
        </div>

        <div className="profile-body-container">
          <aside className="profile-sidebar">
            <img
              src={
                userDetails.profileImage
                  ? userDetails.profileImage
                  : "https://res.cloudinary.com/dy9ojg45y/image/upload/v1758641478/profile-default-svgrepo-com_d0eeud.svg"
              }
              alt="User profile"
              className="profile-avatar"
            />
            <h1 className="profile-name">{userDetails.username}</h1>

            <Link
              to={`/updateProfile/${userDetails._id}`}
              className="edit-profile-btn"
            >
              Edit profile
            </Link>

            <div className="profile-stats">
              <PersonIcon />
              <span className="stat">
                <strong>
                  {userDetails.followedUsers?.length ||
                    Math.floor(Math.random() * 100)}
                </strong>{" "}
                followers
              </span>
              ·
              <span className="stat">
                <strong>
                  {userDetails.starRepos?.length ||
                    Math.floor(Math.random() * 100)}
                </strong>{" "}
                following
              </span>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="profile-main-content">
            {/* ADDED: A new section to display the user's description/bio */}
            <section className="profile-section">
              <h2 className="section-title">About Me</h2>
              <div className="profile-bio-main">
                <p>
                  {userDetails.description ||
                    "This user has not set a bio yet."}
                </p>
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
