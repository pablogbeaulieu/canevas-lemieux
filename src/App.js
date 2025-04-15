import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./api";
import { AnimatePresence, motion } from "framer-motion";  // Ajout de framer-motion
import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";
import Repertoire from "./pages/Repertoire";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import Profile from "./pages/Profile"; // Ajout du Profil

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("users")
      .select("role, isApproved")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erreur récupération rôle :", error.message);
      setUserRole(null);
      setIsAuthenticated(false);
    } else {
      if (data.isApproved) {
        setUserRole(data.role);
        setIsAuthenticated(true);
        localStorage.setItem("userRole", data.role);
      } else {
        alert("Votre compte n’a pas encore été approuvé par un administrateur.");
        await supabase.auth.signOut();
        setUserRole(null);
        setIsAuthenticated(false);
        localStorage.clear();
      }
    }
  };

  const updateLastActive = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id);
  };

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        await fetchUserRole(user.id);
        await updateLastActive();

        const interval = setInterval(() => {
          updateLastActive();
        }, 30000);

        setLoading(false);

        return () => clearInterval(interval);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem("userRole");
        setLoading(false);
      }
    };

    getUser();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    window.addEventListener("error", (e) => {
      if (e.target.tagName === "LINK" || e.target.tagName === "SCRIPT") {
        console.warn("🔄 Ressource manquante, reload forcé...");
        window.location.reload(true);
      }
    }, true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <Router>
      <nav className="bg-blue-800 p-4 text-white flex justify-between">
        <div className="font-bold text-lg">Lemieux Assurances</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:underline">Accueil</Link>

          {isAuthenticated && (
            <>
              <Link to="/canevas" className="hover:underline">Répertoire de Canevas</Link>
              <Link to="/repertoire" className="hover:underline">Répertoire Téléphonique</Link>
            </>
          )}

          {isAuthenticated && userRole === "admin" && (
            <Link to="/admin" className="hover:underline">Admin</Link>
          )}

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:underline">Se connecter</Link>
              <Link to="/register" className="hover:underline">S'inscrire</Link>
            </>
          ) : (
            <Link to="/profile" className="hover:underline">Profil</Link> // Profil ajouté ici
          )}
        </div>
      </nav>

      {loading ? (
        <div className="text-center p-10">Chargement...</div>
      ) : (
        <AnimatePresence>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated
                  ? <Navigate to="/dashboard" replace /> // Redirection vers le dashboard
                  : <Navigate to="/login" replace />
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/canevas" element={<Canevas />} />
            <Route path="/repertoire" element={<Repertoire />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin"
              element={isAuthenticated && userRole === "admin" ? <AdminPage /> : <Navigate to="/dashboard" replace />}
            />
          </Routes>
        </AnimatePresence>
      )}
    </Router>
  );
}

export default App;
