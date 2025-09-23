import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <nav>
      <Link to="/">
        <div>
          <img
            src="https://www.github.com/images/modules/logos_page/GitHub-Mark.png"
            alt="Codium Logo"
          />
          <h3>Codium</h3>
        </div>
      </Link>
      <div>
        <Link to="/create">
          <p>Create a Repository</p>
        </Link>
        <Link to="/profile">
          <p>Profile</p>
        </Link>
        <Link to="/auth">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userId");
              setCurrentUser(null);
            }}
            style={{ position: "fixed", bottom: "50px", right: "50px" }}
            id="logout"
          >
            Logout
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
