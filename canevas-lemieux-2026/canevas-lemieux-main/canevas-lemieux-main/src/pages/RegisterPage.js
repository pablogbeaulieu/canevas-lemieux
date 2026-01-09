import { useState } from "react";
import { supabase } from "../api"; // Assure-toi d'importer correctement le client Supabase
import { useNavigate } from "react-router-dom";

// Fonction pour ajouter l'utilisateur à la table 'users'
const addUserToDatabase = async (user) => {
  if (!user) return;

  try {
    const { data, error } = await supabase.from("users").upsert([
      {
        id: user.id,
        email: user.email,
        role: "user",
      },
    ], { returning: "representation" }); // 🔹 Retourne les données insérées

    if (error) {
      console.error("❌ Erreur lors de l'ajout de l'utilisateur en DB :", error);
    } else {
      console.log("✅ Utilisateur ajouté avec succès dans la table `users` :", data);
    }
  } catch (err) {
    console.error("❌ Erreur inattendue lors de l'ajout à `users` :", err);
  }
};

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);

    try {
      // Création du compte utilisateur via Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erreur lors de l'inscription :", error.message);
        alert("Erreur lors de l'inscription : " + error.message);
        setLoading(false);
        return;
      }

      console.log("✅ Utilisateur inscrit avec succès :", data.user);

      if (!data || !data.user) {
        throw new Error("L'utilisateur n'a pas été créé.");
      }

      // **Ajout d'un délai pour éviter un conflit d'authentification**
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Ajoute l'utilisateur à la table "users"
      await addUserToDatabase(data.user);

      // ✅ Redirige l'utilisateur après l'inscription
      alert("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      navigate("/login");
    } catch (err) {
      console.error("❌ Erreur inattendue :", err);
      alert("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Créer un compte</h1>

        <div className="mt-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Mot de passe</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleRegister}
          className={`mt-4 w-full p-2 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "Création du compte..." : "S'inscrire"}
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
