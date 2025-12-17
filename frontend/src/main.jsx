import { createRoot } from "react-dom/client";
import { AuthProvider } from "./AuthContext.jsx";
import Routes from "./Routes.jsx";
import { BrowserRouter as Router } from "react-router-dom"; //It provides a way to define routes and render different components based on the current URL
//iske bina url routing hoti hi nahi hai basically

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Router>
      <Routes />
    </Router>
  </AuthProvider>
);
