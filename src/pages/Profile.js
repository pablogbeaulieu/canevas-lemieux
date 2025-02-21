import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", first_name: "", nom: "", role: "user" });
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      // Récupération des utilisateurs depuis le backend
      fetch("http://localhost:5000/users")
        .then((res) => res.json())
        .then((data) => {
          setUsersList(data);
          const currentUser = data.find(u => u.username === localStorage.getItem("username"));
          setUser(currentUser);
        })
        .catch((err) => console.error("Erreur lors de la récupération des utilisateurs :", err));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    
    navigate("/login");
    window.location.reload();
  };

  const toggleAdmin = (userId) => {
    const userToToggle = usersList.find(u => u.id === userId);
    if (!userToToggle) return;
    const newRole = userToToggle.role === "admin" ? "user" : "admin";

    fetch(`http://localhost:5000/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
      .then((res) => res.json())
      .then(() => {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        if(user.username === userToToggle.username) {
          setUser({ ...user, role: newRole });
        }
      })
      .catch(err => console.error("Erreur lors de la mise à jour du rôle :", err));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Profil</h1>
      <div className="mt-4 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-lg font-semibold">Identifiant : {user.username}</p>
        <p className="text-lg font-semibold">Prénom : {user.first_name}</p>
        <p className="text-lg font-semibold">Nom : {user.nom}</p>
        {user.role === "admin" && <p className="text-lg font-bold text-red-500">Administrateur</p>}

        <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Se Déconnecter
        </button>
      </div>

      {user.role === "admin" && (
        <div className="mt-6 w-96">
          <h2 className="text-2xl font-bold text-gray-700">Gestion des utilisateurs</h2>
          {usersList.map((u) => (
            <div key={u.id} className="flex justify-between p-2 border rounded mt-2">
              <span>{u.username} {u.role === "admin" ? "(Admin)" : ""}</span>
              {u.username !== user.username && (
                <button 
                  className={`text-sm ${u.role === "admin" ? "text-red-500" : "text-blue-600"}`} 
                  onClick={() => toggleAdmin(u.id)}
                >
                  {u.role === "admin" ? "Révoquer Admin" : "Promouvoir Admin"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;
