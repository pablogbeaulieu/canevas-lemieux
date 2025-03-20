import { useState, useEffect } from "react";
import { supabase } from "../api"; // Connexion à Supabase
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState(null); // Stocke le rôle
  const navigate = useNavigate();

  // 🔹 Fonction pour récupérer le rôle de l'utilisateur
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single(); // Prend un seul utilisateur
  
    if (error) {
      console.error("❌ Erreur récupération rôle:", error);
      return null;
    }
  
    return data?.role; // Retourne "user" ou "admin"
  };

  // 🔹 Gestion de la connexion
  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Erreur de connexion : " + error.message);
        return;
      }

      const user = data.user;
      if (!user) throw new Error("L'utilisateur n'a pas pu être trouvé.");

      // 🔹 Récupère le rôle depuis Supabase
      const role = await fetchUserRole(user.id);
      setUserRole(role); // Met à jour l'état

      // 🔹 Stocke le rôle dans localStorage pour l'accès rapide
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userId", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", role || "user"); // Par défaut, "user"

      console.log(`✅ Utilisateur connecté : ${user.email}, Rôle : ${role}`);

      // Redirige l'utilisateur selon son rôle
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }

      window.location.reload(); // Rafraîchir l'application après connexion
    } catch (err) {
      console.error("❌ Erreur lors de la connexion :", err);
      alert("Une erreur s'est produite lors de la connexion.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Connexion</h1>

        <div className="mt-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Mot de passe</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleLogin}
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
