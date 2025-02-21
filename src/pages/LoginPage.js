import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();

      if (response.ok) {
        // Stocker les informations utilisateur dans le localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("firstName", data.user.first_name);
        localStorage.setItem("lastName", data.user.nom);
        localStorage.setItem("email", data.user.email);
        localStorage.setItem("role", data.user.role);

        navigate("/dashboard");
        window.location.reload();
      } else {
        alert(data.error || "Email ou mot de passe incorrect !");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      alert("Erreur lors de la connexion, veuillez réessayer.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Connexion</h1>
        <p className="text-gray-700 mt-2 text-center">Bienvenue sur Courtia</p>

        <div className="mt-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Mot de passe</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
          />
        </div>

        <button onClick={handleLogin} className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Se connecter
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
