import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./api"; // Connexion à Supabase
import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";
import Repertoire from "./pages/Repertoire"; // 📌 Import de la nouvelle page Répertoire
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage"; // 📌 Import de la page Admin

function App() {
  // États pour suivre l'authentification et le rôle utilisateur
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le rôle utilisateur depuis Supabase
  const fetchUserRole = async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erreur récupération rôle :", error.message);
      setUserRole(null);
    } else {
      setUserRole(data.role);
      localStorage.setItem("userRole", data.role); // Stocker le rôle
    }
  };

  // Vérifie si un utilisateur est connecté et récupère son rôle
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        fetchUserRole(user.id);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    };

    getUser();
  }, []);

  // Fonction pour la déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    window.location.href = "/login"; // Redirection après déconnexion
  };

  return (
    <Router>
      <nav className="bg-blue-600 p-4 text-white flex justify-between">
        <div className="font-bold text-lg">Lemieux Assurances</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:underline">Accueil</Link>

          {/* Affiche "Répertoire de Canevas" uniquement si l'utilisateur est connecté */}
          {isAuthenticated && (
            <>
              <Link to="/canevas" className="hover:underline">Répertoire de Canevas</Link>
              <Link to="/repertoire" className="hover:underline">Répertoire Téléphonique</Link> {/* ✅ Nouvel onglet */}
            </>
          )}

          {/* Affiche "Admin" uniquement pour les administrateurs */}
          {isAuthenticated && userRole === "admin" && (
            <Link to="/admin" className="hover:underline">Admin</Link>
          )}

          {/* Gestion connexion/déconnexion */}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:underline">Se connecter</Link>
              <Link to="/register" className="hover:underline">S'inscrire</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="hover:underline">
              Se déconnecter
            </button>
          )}
        </div>
      </nav>

      {loading ? (
        <div className="text-center p-10">Chargement...</div>
      ) : (
        <Routes>
          {/* Redirection par défaut : vers Canevas si connecté, sinon vers Login */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/canevas" replace /> : <Navigate to="/login" replace />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/canevas" element={<Canevas />} />
          <Route path="/repertoire" element={<Repertoire />} /> {/* ✅ Ajout de la route Répertoire */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protection de la route Admin */}
          <Route
            path="/admin"
            element={isAuthenticated && userRole === "admin" ? <AdminPage /> : <Navigate to="/dashboard" replace />}
          />
        </Routes>
      )}
    </Router>
  );
}

export default App;
