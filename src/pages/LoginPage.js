import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si le Super Admin existe déjà
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const adminExists = users.some(user => user.username === "pablogbeaulieu");

    if (!adminExists) {
      // Ajouter le compte Super Admin si inexistant
      const superAdmin = {
        username: "pablogbeaulieu",
        firstName: "Pablo",
        lastName: "Gagnon Beaulieu",
        email: "pablo.beaulieu@lemieuxassurances.com",
        password: "Lemieux2!",
        isAdmin: true
      };
      users.push(superAdmin);
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, []);

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", user.username);
      localStorage.setItem("firstName", user.firstName);
      localStorage.setItem("lastName", user.lastName);
      localStorage.setItem("email", user.email);
      localStorage.setItem("isAdmin", user.isAdmin);

      navigate("/dashboard");
      window.location.reload(); // Rafraîchir les onglets après connexion
    } else {
      alert("Identifiant ou mot de passe incorrect !");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Connexion</h1>
        <p className="text-gray-700 mt-2 text-center">Bienvenue sur Courtia</p>

        <div className="mt-4">
          <label className="block text-gray-700">Identifiant</label>
          <input type="text" className="w-full p-2 border rounded" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Mot de passe</label>
          <input type="password" className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button onClick={handleLogin} className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Se connecter
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
