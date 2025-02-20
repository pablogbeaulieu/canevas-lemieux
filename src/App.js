import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("isAuthenticated") === "true");
  }, []);

  return (
    <Router>
      <nav className="bg-blue-600 p-4 text-white flex justify-between">
        <div className="font-bold text-lg">Courtia</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:underline">Accueil</Link>
          <Link to="/canevas" className="hover:underline">Répertoire de Canevas</Link>
          {isAuthenticated ? (
            <Link to="/profile" className="hover:underline">Profil</Link>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Se connecter</Link>
              <Link to="/register" className="hover:underline">S'inscrire</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canevas" element={<Canevas />} />
      </Routes>
    </Router>
  );
}

export default App;
