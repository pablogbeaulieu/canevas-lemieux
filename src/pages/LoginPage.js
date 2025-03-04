import { useState } from "react";
import { supabase } from "../api"; // Assure-toi d'importer correctement le client Supabase
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");  // Utilisation de l'email pour l'authentification
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Connexion avec Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Erreur de connexion : " + error.message);
        return;
      }

      // Vérifie si l'utilisateur est bien défini avant de tenter d'y accéder
      if (!data || !data.user) {
        throw new Error("L'utilisateur n'a pas pu être trouvé.");
      }

      const user = data.user; // Correction pour récupérer l'utilisateur

      // Enregistrer les informations de l'utilisateur dans le localStorage
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", user.email);
      localStorage.setItem("email", user.email);

      // Rediriger l'utilisateur vers le tableau de bord ou une autre page après la connexion réussie
      navigate("/dashboard");
      window.location.reload(); // Rafraîchir les onglets après connexion
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      alert("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
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
