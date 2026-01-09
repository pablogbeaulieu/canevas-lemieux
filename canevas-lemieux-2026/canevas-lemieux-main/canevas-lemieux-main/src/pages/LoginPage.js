import { useState } from "react";
import { supabase } from "../api";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("❌ Erreur récupération rôle:", error);
      return null;
    }

    return data?.role;
  };

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

      const role = await fetchUserRole(user.id);
      setUserRole(role);

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userId", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", role || "user");

      console.log(`✅ Utilisateur connecté : ${user.email}, Rôle : ${role}`);

      navigate(role === "admin" ? "/admin-dashboard" : "/dashboard");
      window.location.reload();
    } catch (err) {
      console.error("❌ Erreur lors de la connexion :", err);
      alert("Une erreur s'est produite lors de la connexion.");
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Veuillez entrer votre courriel pour envoyer la demande.");
      return;
    }

    const { error } = await supabase.from("password_reset_requests").insert([
      { email }
    ]);

    if (error) {
      console.error("Erreur Supabase :", error.message);
      alert("Erreur lors de la demande : " + error.message);
    } else {
      alert("Votre demande de réinitialisation a été enregistrée. Un administrateur vous contactera.");
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

        <button
          onClick={handleResetPassword}
          className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
