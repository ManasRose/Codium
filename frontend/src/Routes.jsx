import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";

//Pages
import Dashboard from "./components/dashboard/Dashboard.jsx";
import Profile from "./components/user/Profile.jsx";
import Login from "./components/auth/Login.jsx";
import Signup from "./components/auth/Signup.jsx";
import UserRepo from "./components/repo/NewRepo.jsx";
import NewRepo from "./components/repo/NewRepo.jsx";
import UnderDev from "./UnderDev.jsx";
import EditUser from "./components/user/EditUser.jsx";

//Auth context
import { useAuth } from "./AuthContext.jsx";
import YourRepo from "./components/repo/YourRepo.jsx";

const ProjectRoutes = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");

    if (userIdFromStorage && !currentUser) {
      setCurrentUser(userIdFromStorage);
    } //if the user is logged in, set the current user

    if (
      !userIdFromStorage &&
      !["/auth", "/signup"].includes(window.location.pathname)
    ) {
      navigate("/auth");
    } //if the user is not logged in and not on login or signup page, send to login page

    if (userIdFromStorage && window.location.pathname === "/auth") {
      navigate("/");
    } //if the user is logged in and on login page, send to dashboard
  }, [currentUser, navigate, setCurrentUser]);

  let element = useRoutes([
    {
      path: "/",
      element: <Dashboard />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/auth",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/repo/user/:userID",
      element: <YourRepo />,
    },
    {
      path: "/repo/create",
      element: <NewRepo />,
    },
    {
      path: "/updateProfile/:id",
      element: <EditUser />,
    },
    {
      path: "*",
      element: <UnderDev />,
    },
  ]);
  return element;
};

export default ProjectRoutes;
