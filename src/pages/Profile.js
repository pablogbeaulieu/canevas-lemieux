import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "", firstName: "", lastName: "", isAdmin: false });
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
        navigate("/login");
    } else {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        setUsersList(users); // Récupère TOUS les utilisateurs
        const currentUser = users.find(u => u.username === localStorage.getItem("username"));
        setUser(currentUser);
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
  window.location.reload(); // Rafraîchir l'interface
};

  const toggleAdmin = (username) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map(u => 
      u.username === username ? { ...u, isAdmin: !u.isAdmin } : u
    );
    
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsersList(updatedUsers);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Profil</h1>
      <div className="mt-4 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-lg font-semibold">Identifiant : {user.username}</p>
        <p className="text-lg font-semibold">Prénom : {user.firstName}</p>
        <p className="text-lg font-semibold">Nom : {user.lastName}</p>
        {user.isAdmin && <p className="text-lg font-bold text-red-500">Administrateur</p>}

        <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Se Déconnecter
        </button>
      </div>

      {user.isAdmin && (
        <div className="mt-6 w-96">
          <h2 className="text-2xl font-bold text-gray-700">Gestion des utilisateurs</h2>
          {usersList.map((u, index) => (
            <div key={index} className="flex justify-between p-2 border rounded mt-2">
              <span>{u.username} {u.isAdmin ? "(Admin)" : ""}</span>
              {u.username !== user.username && (
                <button 
                  className={`text-sm ${u.isAdmin ? "text-red-500" : "text-blue-600"}`} 
                  onClick={() => toggleAdmin(u.username)}
                >
                  {u.isAdmin ? "Révoquer Admin" : "Promouvoir Admin"}
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
