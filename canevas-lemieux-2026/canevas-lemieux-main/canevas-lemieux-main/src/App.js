import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./api";
import { AnimatePresence } from "framer-motion";

import Dashboard from "./pages/Dashboard";
import Canevas from "./pages/Canevas";
import Repertoire from "./pages/Repertoire";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import Profile from "./pages/Profile";
import OutilsPage from "./pages/OutilsPage";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id);
  };

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

    window.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "LINK" || e.target.tagName === "SCRIPT") {
          console.warn("🔄 Ressource manquante, reload forcé...");
          window.location.reload(true);
        }
      },
      true
    );
  }, []);

  // ✅ Style des onglets (pills + actif + hover)
const navItemClass = ({ isActive }) =>
  [
    "px-4 py-2 rounded-md text-base font-medium", // ⬅️ plus gros + plus d’air
    "transition-all duration-200",
    "hover:bg-white/20 hover:text-white",
    "focus:outline-none focus:ring-2 focus:ring-white/50",
    isActive
      ? "bg-white/30 text-white shadow-sm" // ⬅️ actif très lisible
      : "text-white",
  ].join(" ");

  return (
    <Router>
      <nav className="bg-blue-800 p-4 text-white flex items-center justify-between">
        <div className="font-bold text-lg">Lemieux Assurances</div>

        <div className="flex items-center gap-2">
          <NavLink to="/dashboard" className={navItemClass}>
            Accueil
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/canevas" className={navItemClass}>
                Particulier
              </NavLink>

              <NavLink to="/canevas-entreprise" className={navItemClass}>
                Entreprise
              </NavLink>

              <NavLink to="/repertoire" className={navItemClass}>
                Répertoire
              </NavLink>

              <NavLink to="/outils" className={navItemClass}>
                Outils
              </NavLink>
            </>
          )}

          {isAuthenticated && userRole === "admin" && (
            <>
              <div className="mx-1 h-6 w-px bg-white/20" />
              <NavLink to="/admin" className={navItemClass}>
                Admin
              </NavLink>
            </>
          )}

          <div className="mx-1 h-6 w-px bg-white/20" />

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navItemClass}>
                Se connecter
              </NavLink>
              <NavLink to="/register" className={navItemClass}>
                S'inscrire
              </NavLink>
            </>
          ) : (
            <NavLink to="/profile" className={navItemClass}>
              Profil
            </NavLink>
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
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route path="/dashboard" element={<Dashboard />} />

            <Route
              path="/canevas"
              element={isAuthenticated ? <Canevas /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/canevas-entreprise"
              element={
                isAuthenticated ? <Canevas sector="entreprise" /> : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/repertoire"
              element={isAuthenticated ? <Repertoire /> : <Navigate to="/login" replace />}
            />

            <Route
              path="/outils"
              element={isAuthenticated ? <OutilsPage /> : <Navigate to="/login" replace />}
            />

            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<Profile />} />

            <Route
              path="/admin"
              element={
                isAuthenticated && userRole === "admin" ? (
                  <AdminPage />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
          </Routes>
        </AnimatePresence>
      )}
    </Router>
  );
}

export default App;
