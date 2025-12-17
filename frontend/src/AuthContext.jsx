import React, { useState, useEffect, useContext, createContext } from "react";

const AuthContext = createContext(); //contains AuthContext.Provider and AuthContext.Consumer
//context is a piece of data which is available to all parts of the applications

export const useAuth = () => {
  //custom hook
  return useContext(AuthContext); //instead of writing useContext(AuthContext) everywhere in all components, now we just write useAuth()
};

export const AuthProvider = ({ children }) => {
  //This is a special prop in React. It refers to any other React components that you "wrap" inside <AuthProvider>
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
  //  <AuthContext.Provider ...>: This is the component that "broadcasts" the value to all components inside it.

  // value={value}: This provides the { currentUser, setCurrentUser } object to the context.

  // {children}: This renders all the components that were nested inside AuthProvider.
};
