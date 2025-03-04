import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";

function App() {
  // Vérifie si l'utilisateur est connecté
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  return (
    <Router>
      <nav className="bg-blue-600 p-4 text-white flex justify-between">
        <div className="font-bold text-lg">Lemieux Assurances</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:underline">Accueil</Link>
          
          {/* Affiche l'onglet "Répertoire de Canevas" uniquement si l'utilisateur est connecté */}
          {isAuthenticated && (
            <Link to="/canevas" className="hover:underline">Répertoire de Canevas</Link>
          )}
          
          {/* Affiche les liens Login/Inscription seulement si l'utilisateur n'est pas connecté */}
          {!isAuthenticated && (
            <>
              <Link to="/login" className="hover:underline">Se connecter</Link>
              <Link to="/register" className="hover:underline">S'inscrire</Link>
            </>
          )}
        </div>
      </nav>

      <Routes>
        {/* Redirection par défaut vers le répertoire */}
        <Route path="/" element={<Navigate to="/canevas" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canevas" element={<Canevas />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
