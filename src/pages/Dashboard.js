import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api"; // Assure-toi d'importer Supabase

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login"); // Si pas connecté, rediriger vers la connexion
    }
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Déconnexion de Supabase
    localStorage.removeItem("isAuthenticated"); // Retire l'authentification locale
    window.location.reload(); // 🔄 Force un rafraîchissement immédiat
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Tableau de Bord</h1>
      <p className="text-gray-700 mt-2">Bienvenue dans l'application.</p>

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Se Déconnecter
      </button>
    </div>
  );
}

export default Dashboard;
