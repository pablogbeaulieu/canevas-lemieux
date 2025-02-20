import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!username || !firstName || !lastName || !email || !password) {
        alert("Tous les champs sont obligatoires !");
        return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.some(user => user.username === username)) {
        alert("Cet identifiant est déjà utilisé !");
        return;
    }

    const newUser = {
        username,
        firstName,
        lastName,
        email,
        password,
        isAdmin: false // Toujours utilisateur par défaut
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Compte utilisateur créé avec succès !");
    navigate("/login");
};

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="p-10 bg-white shadow-lg rounded-lg w-96">
        <h1 className="text-3xl font-bold text-blue-600 text-center">Inscription</h1>
        <p className="text-gray-700 mt-2 text-center">Créez un compte utilisateur</p>

        <div className="mt-4">
          <label className="block text-gray-700">Identifiant</label>
          <input type="text" className="w-full p-2 border rounded" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Prénom</label>
          <input type="text" className="w-full p-2 border rounded" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Nom</label>
          <input type="text" className="w-full p-2 border rounded" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Courriel</label>
          <input type="email" className="w-full p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700">Mot de passe</label>
          <input type="password" className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button onClick={handleRegister} className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          S'inscrire
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
