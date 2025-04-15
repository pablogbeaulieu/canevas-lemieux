import { useState, useEffect } from "react";
import { supabase } from "../api"; // Import du client Supabase
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Importation de motion pour les animations

function Profile() {
  const [userEmail, setUserEmail] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Récupérer l'utilisateur connecté
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
      } else if (user) {
        setUserEmail(user.email); // On stocke l'email de l'utilisateur
      }
    };

    fetchUser();
  }, []);

  // Fonction de déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); // Supprime les données locales
    navigate("/login"); // Redirige vers la page de connexion
  };

  // Fonction de mise à jour du mot de passe
  const updatePassword = async () => {
    setError('');
    setSuccessMessage('');

    // Vérification des mots de passe
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    try {
      // Mise à jour du mot de passe dans Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError('Une erreur est survenue lors de la mise à jour du mot de passe.');
        console.error(error.message);
      } else {
        setSuccessMessage('Mot de passe mis à jour avec succès.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError('Une erreur inconnue est survenue.');
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }} // Durée de l'animation
      className="flex items-center justify-center h-screen bg-gray-200"
    >
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Profil</h1>

        {userEmail ? (
          <>
            <p className="mt-4 text-gray-700 text-center">
              <strong>Email :</strong> {userEmail}
            </p>
            
            {/* Formulaire de modification du mot de passe */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-center mb-4">Modifier votre mot de passe</h2>

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}

              <div className="mb-4">
                <label htmlFor="oldPassword" className="block text-sm font-semibold">Ancien mot de passe</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Entrez votre ancien mot de passe"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-semibold">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="p-2 border rounded w-full mb-2"
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-2 border rounded w-full mb-4"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>

              <button
                onClick={updatePassword}
                className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              >
                Modifier le mot de passe
              </button>
            </div>

            {/* Bouton de déconnexion */}
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <p className="mt-4 text-red-500 text-center">Utilisateur non connecté.</p>
        )}
      </div>
    </motion.div>
  );
}

export default Profile;
