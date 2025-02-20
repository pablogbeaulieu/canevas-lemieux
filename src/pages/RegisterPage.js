import React, { useState } from "react";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    console.log("📤 Envoi des données :", { username, firstName, lastName, email, password });

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, firstName, lastName, email, password, role: "user" }),
      });

      const data = await response.json();
      console.log("🔄 Réponse backend :", data);

      if (response.ok) {
        alert("✅ Inscription réussie !");
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (error) {
      console.error("❌ Erreur d'inscription :", error);
      setError("Erreur serveur, veuillez réessayer.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Créer un compte</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-gray-600 font-medium">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Nom d'utilisateur"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Votre prénom"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Entrez votre email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-500"
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            S'inscrire
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Déjà un compte ? <a href="/login" className="text-blue-500 hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
