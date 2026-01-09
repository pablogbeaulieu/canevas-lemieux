import { useEffect, useState } from "react";
import { supabase } from "../api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Profile() {
  const [userEmail, setUserEmail] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        return;
      }

      if (user) setUserEmail(user.email);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate("/login");
  };

  const updatePassword = async () => {
    setError("");
    setSuccessMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Merci de remplir les deux champs.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error(error.message);
        setError("Une erreur est survenue lors de la mise à jour du mot de passe.");
        return;
      }

      setSuccessMessage("Mot de passe mis à jour avec succès.");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      console.error(e);
      setError("Une erreur inconnue est survenue.");
    }
  };

  return (
    <motion.div
      className="p-6 bg-white"
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ✅ En-tête “clean” comme les autres pages */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 border border-blue-100">
          Profil
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Mon compte
        </h1>

        <p className="mt-1 text-slate-600">
          Modifiez votre mot de passe ou déconnectez-vous.
        </p>
      </div>

      {/* ✅ Carte principale */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
          <p className="text-sm text-slate-600">Compte connecté</p>
        </div>

        <div className="px-5 py-4">
          {userEmail ? (
            <>
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="text-sm text-slate-600">Courriel</div>
                <div className="mt-1 text-slate-900 font-semibold break-all">
                  {userEmail}
                </div>
              </div>

              {/* ✅ Section mot de passe */}
              <div className="mt-5 rounded-lg border p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-900">
                    Modifier le mot de passe
                  </h3>
                  <p className="text-sm text-slate-600">
                    Minimum 6 caractères.
                  </p>
                </div>

                <AnimatePresence>
                  {!!error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!!successMessage && (
                    <motion.div
                      key="ok"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                    >
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Nouveau mot de passe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirmer
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Confirmer"
                    />
                  </div>
                </div>

                <button
                  onClick={updatePassword}
                  className="mt-4 w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 transition"
                >
                  Mettre à jour
                </button>
              </div>

              {/* ✅ Déconnexion */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700 transition"
                >
                  Se déconnecter
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border bg-yellow-50 border-yellow-200 p-4 text-yellow-900">
              Utilisateur non connecté.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Profile;
