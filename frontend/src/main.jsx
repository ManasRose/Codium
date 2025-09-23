import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./AuthContext.jsx";
import ProjectRoutes from "./routes.jsx";
import { BrowserRouter as Router } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Router>
      <ProjectRoutes />
    </Router>
  </AuthProvider>
);
