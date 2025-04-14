import { useEffect, useState } from "react";
import { supabase } from "../api";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [userReady, setUserReady] = useState(false);
  const navigate = useNavigate();

  // Attend que Supabase connecte l'utilisateur via le lien
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserReady(true);
      } else {
        // Écoute si l'user se connecte via access_token
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" && session?.user) {
            setUserReady(true);
          }
        });
      }
    };

    checkSession();
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
          <p className="text-center text-gray-600">⏳ Vérification du lien en cours...</p>
        )}

        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;
