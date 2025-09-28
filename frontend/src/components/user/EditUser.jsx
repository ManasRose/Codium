import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditProfile.css";
import Navbar from "../Navbar/Navbar";

const EditProfile = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  // Initialize with null instead of an empty string
  const [previewImage, setPreviewImage] = useState(null);

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get(`/api/userProfile/${userId}`);
        const userData = response.data;
        setUsername(userData.username || "");
        setDescription(userData.description || "");
        setPreviewImage(userData.profileImage || null); // Set to null if no image exists
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };
    fetchUserData();
  }, [userId, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("description", description);

    if (password) {
      formData.append("password", password);
    }
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      await axios.put(`/api/updateProfile/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data || "Failed to update profile. Please try again."
      );
      console.error("Update error:", err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="edit-profile-container">
        <h2>Public profile</h2>
        <p className="edit-profile-subtitle">
          Update your profile information.
        </p>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div className="form-group image-upload-group">
            {/* --- THIS IS THE KEY CHANGE --- */}
            {/* Only render the image tag if previewImage has a value */}
            {previewImage && (
              <img
                src={previewImage}
                alt="Profile Preview"
                className="profile-preview"
              />
            )}
            <div>
              <label htmlFor="profileImage">Profile Picture</label>
              <input
                type="file"
                id="profileImage"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Bio</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us a little about yourself"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="save-changes-btn">
            Update profile
          </button>
        </form>
      </main>
    </>
  );
};

export default EditProfile;
