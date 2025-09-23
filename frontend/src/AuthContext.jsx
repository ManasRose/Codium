import React, { useState, useEffect, useContext, createContext } from "react";

const AuthContext = createContext();
//context is a piece of data which is available to all parts of the applications

export const useAuth = () => {
  //custom hook
  return useContext(AuthContext); //instead of writing useContext(AuthContext) everywhere, now we just write useAuth()
};

export const AuthProvider = ({ children }) => {
  //wrapper component that will provide authentication data (currentUser) to everything inside it
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUser(userId);
    }
  }, []); //to make sure user stays logged in even after refreshing the page
  const value = {
    currentUser,
    setCurrentUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
