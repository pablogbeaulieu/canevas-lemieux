import { useEffect, useState } from "react";
import { supabase } from "../api";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifie si le token est présent dans l'URL
    const hash = window.location.hash;
    if (hash.includes("access_token") && hash.includes("type=recovery")) {
      setIsTokenValid(true);
    } else {
      setIsTokenValid(false);
      setMessage("Lien invalide ou expiré. Veuillez recommencer la procédure.");
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("Erreur lors de la mise à jour : " + error.message);
    } else {
      setMessage("🎉 Mot de passe mis à jour avec succès !");
      setTimeout(() => {
        navigate("/"); // Redirige vers la page de login
      }, 2000);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-lg w-96">
        <h2 className="text-xl font-bold text-center text-blue-700 mb-4">Réinitialisation du mot de passe</h2>

        {isTokenValid ? (
          <>
            <label className="block text-gray-700 mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              className="w-full p-2 border rounded mb-4"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handleUpdatePassword}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Mettre à jour
            </button>
          </>
        ) : (
          <p className="text-red-600 text-center">{message}</p>
        )}

        {message && isTokenValid && <p className="mt-4 text-green-600 text-center">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;
