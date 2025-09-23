import React from "react";
import { Link } from "react-router-dom";
import "./UnderDev.css"; // We will create this file next
import Navbar from "./components/Navbar/Navbar"; // Adjust path if necessary
import { FaTools } from "react-icons/fa"; // Using a "tools" icon for construction

const UnderDev = () => {
  return (
    <>
      <Navbar />
      <div className="under-dev-container">
        <div className="under-dev-content">
          <FaTools className="under-dev-icon" />
          <h1 className="under-dev-title">Feature Under Development</h1>
          <p className="under-dev-text">
            This page is currently under construction. Please check back later!
          </p>
          <Link to="/" className="under-dev-home-btn">
            Go Back Home
          </Link>
        </div>
      </div>
    </>
  );
};

export default UnderDev;
