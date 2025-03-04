import { useState } from "react";
import { supabase } from "../api"; // Assure-toi d'importer correctement le client Supabase
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      // Inscrire l'utilisateur dans Supabase
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert("Erreur lors de l'inscription : " + error.message);
        return;
      }

      // Vérification de l'objet user avant d'accéder à ses propriétés
      if (!user) {
        throw new Error("Utilisateur non défini");
      }

      // Ajouter des informations supplémentaires dans la table 'profiles' si nécessaire
      const { data, errorProfile } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id, // Maintenant on s'assure que 'user' est défini avant d'y accéder
            email: user.email,
            // Ajouter d'autres informations si nécessaire
          }
        ]);

      if (errorProfile) {
        console.log("Erreur lors de l'ajout au profil :", errorProfile);
      } else {
        console.log("Utilisateur inscrit et profil ajouté :", data);
      }

      // Rediriger l'utilisateur après l'inscription
      navigate("/login"); // Par exemple, rediriger vers la page de connexion après l'inscription réussie
    } catch (err) {
      console.error("Une erreur s'est produite pendant l'inscription :", err);
      alert("Une erreur s'est produite pendant l'inscription. Veuillez réessayer.");
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
          onClick={handleRegister}
          className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          S'inscrire
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
