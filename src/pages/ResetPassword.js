import { useEffect, useState } from "react";
import { supabase } from "../api";
import { useNavigate } from "react-router-dom";

window.supabase = supabase; // Pour debug console

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userReady, setUserReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;

    // 🔍 Extraire le token de l’URL
    const match = hash.match(/access_token=([^&]+)/);
    const token = match ? match[1] : null;

    if (token) {
      supabase.auth
        .verifyOtp({ type: "recovery", token })
        .then(async (res) => {
          if (res.data?.user) {
            console.log("✅ Utilisateur connecté :", res.data.user);
            setUserReady(true);
          } else {
            console.error("Aucun utilisateur détecté après verifyOtp");
            setMessage("❌ Impossible de valider le lien. Réessayez.");
          }
        })
        .catch((err) => {
          console.error("Erreur verifyOtp:", err.message);
          setMessage("⚠️ Lien invalide ou expiré. Veuillez refaire la procédure.");
        });
    } else {
      setMessage("❌ Lien invalide. Veuillez recommencer.");
    }
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage("Erreur lors de la mise à jour : " + error.message);
    } else {
      setMessage("✅ Mot de passe mis à jour. Redirection en cours...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-lg w-96">
        <h2 className="text-xl font-bold text-blue-700 text-center mb-4">Réinitialisation du mot de passe</h2>

        {userReady ? (
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
          <p className="text-center text-gray-600">{message || "⏳ Vérification du lien en cours..."}</p>
        )}

        {message && userReady && (
          <p className="mt-4 text-center text-green-600">{message}</p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
