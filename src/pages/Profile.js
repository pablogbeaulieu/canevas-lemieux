import { useState, useEffect } from "react";
import { supabase } from "../api"; // Import du client Supabase
import { useNavigate } from "react-router-dom";

function Profile() {
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); // Supprime les données locales
    navigate("/login"); // Redirige vers la page de connexion
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Profil</h1>

        {userEmail ? (
          <>
            <p className="mt-4 text-gray-700 text-center">
              <strong>Email :</strong> {userEmail}
            </p>
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
    </div>
  );
}

export default Profile;
