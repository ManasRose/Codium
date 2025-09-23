import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewRepo.css"; // We will create this file next
import Navbar from "../Navbar/Navbar"; // Make sure the path is correct
import { VscRepo } from "react-icons/vsc";

const NewRepo = () => {
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true); // true for Public, false for Private
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleCreateRepository = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!repoName) {
      setError("Repository name is required.");
      return;
    }

    if (!userId) {
      setError("You must be logged in to create a repository.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/repo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repoName,
          description,
          visibility,
          owner: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create repository.");
      }

      // On success, redirect to the new repository's page
      navigate(`/`);
    } catch (err) {
      setError(err.message);
      console.error("Creation error:", err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="create-repo-container">
        <div className="create-repo-header">
          <h2 className="create-repo-title">Create a new repository</h2>
          <p className="create-repo-subtitle">
            A repository contains all project files, including the revision
            history.
          </p>
        </div>

        <form className="create-repo-form" onSubmit={handleCreateRepository}>
          <div className="form-group">
            <label htmlFor="repoName">Repository name</label>
            <input
              type="text"
              id="repoName"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <hr className="form-divider" />

          <div className="form-group visibility-group">
            <div className="radio-option">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={visibility === true}
                onChange={() => setVisibility(true)}
              />
              <label htmlFor="public">
                <strong>Public</strong>
                <p>Anyone on the internet can see this repository.</p>
              </label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="private"
                name="visibility"
                checked={visibility === false}
                onChange={() => setVisibility(false)}
              />
              <label htmlFor="private">
                <strong>Private</strong>
                <p>You choose who can see and commit to this repository.</p>
              </label>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="create-repo-submit-btn">
            Create repository
          </button>
        </form>
      </main>
    </>
  );
};

export default NewRepo;
