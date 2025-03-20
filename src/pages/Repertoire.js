import { useState, useEffect } from "react";
import { supabase } from "../api"; // 📌 Connexion à Supabase

function Repertoire() {
  const [contacts, setContacts] = useState([]);
  const [assureurs, setAssureurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedAssureur, setSelectedAssureur] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // États pour l'ajout d'un canevas
  const [newAssureur, setNewAssureur] = useState("");
  const [newCategorie, setNewCategorie] = useState("");
  const [newTelephone, setNewTelephone] = useState("");
  const [newCourriel, setNewCourriel] = useState("");
  const [isNewAssureur, setIsNewAssureur] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchAssureurs();
    fetchUserRole();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from("repertoire")
      .select("*")
      .order("assureur", { ascending: true });

    if (!error) setContacts(data);
    setLoading(false);
  };

  const fetchAssureurs = async () => {
    let { data, error } = await supabase
      .from("repertoire")
      .select("assureur")
      .order("assureur", { ascending: true });

    if (!error) {
      const uniqueAssureurs = [...new Set(data.map((item) => item.assureur))];
      setAssureurs(uniqueAssureurs);
    }
  };

  const fetchUserRole = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (!userError) setUserRole(userData.role);
    }
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.assureur]) acc[contact.assureur] = [];
    acc[contact.assureur].push(contact);
    return acc;
  }, {});

  const addCanevas = async () => {
    const assureurFinal = isNewAssureur ? newAssureur.trim() : newAssureur;

    if (!assureurFinal || !newCategorie || !newTelephone || !newCourriel) {
      alert("Tous les champs sont obligatoires !");
      return;
    }

    const { error } = await supabase.from("repertoire").insert([
      { assureur: assureurFinal, categorie: newCategorie, telephone: newTelephone, courriel: newCourriel },
    ]);

    if (!error) {
      setNewAssureur("");
      setNewCategorie("");
      setNewTelephone("");
      setNewCourriel("");
      setIsNewAssureur(false);
      setShowAddForm(false);
      fetchContacts();
      fetchAssureurs();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">📞 Répertoire Téléphonique</h1>

      {/* 🆕 Formulaire d'ajout (réservé aux admins) */}
      {userRole === "admin" && (
        <div className="bg-gray-100 p-4 rounded-md mb-6 shadow-md">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-blue-500 text-white font-bold p-3 rounded-md text-lg transition-all duration-300 hover:bg-blue-600"
          >
            {showAddForm ? "FERMER" : "AJOUTER"}
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showAddForm ? "max-h-screen opacity-100 scale-100 mt-4" : "max-h-0 opacity-0 scale-95"
            }`}
          >
            {/* Sélection ou ajout d'un assureur */}
            <div className="mb-2">
              <label className="block font-semibold mb-1">Assureur :</label>
              {!isNewAssureur ? (
                <>
                  <select
                    value={newAssureur}
                    onChange={(e) => setNewAssureur(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                  >
                    <option value="">Sélectionner un assureur</option>
                    {assureurs.map((assureur, index) => (
                      <option key={index} value={assureur}>{assureur}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsNewAssureur(true)}
                    className="text-blue-600 underline text-sm transition-all duration-300 hover:text-blue-800"
                  >
                    + Ajouter un nouvel assureur
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Nom de l'assureur"
                    value={newAssureur}
                    onChange={(e) => setNewAssureur(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                  />
                  <button
                    onClick={() => setIsNewAssureur(false)}
                    className="text-red-600 underline text-sm transition-all duration-300 hover:text-red-800"
                  >
                    Annuler
                  </button>
                </>
              )}
            </div>

            <input type="text" placeholder="Catégorie" value={newCategorie} onChange={(e) => setNewCategorie(e.target.value)} className="p-2 border rounded w-full mb-2" />
            <input type="text" placeholder="Téléphone" value={newTelephone} onChange={(e) => setNewTelephone(e.target.value)} className="p-2 border rounded w-full mb-2" />
            <input type="text" placeholder="Courriel" value={newCourriel} onChange={(e) => setNewCourriel(e.target.value)} className="p-2 border rounded w-full mb-2" />

            <button
              onClick={addCanevas}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full transition-all duration-300"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Chargement des contacts...</p>
      ) : (
        assureurs.map((assureur) => (
          <div key={assureur} className="mb-4">
            <div
              className="flex justify-between items-center bg-gray-200 p-3 cursor-pointer hover:bg-gray-300 transition-all duration-300 rounded-md shadow-md"
              onClick={() => setSelectedAssureur(selectedAssureur === assureur ? null : assureur)}
            >
              <h2 className="text-xl font-semibold">{assureur}</h2>
              <span className={`transform transition-transform duration-300 ${selectedAssureur === assureur ? "rotate-180" : "rotate-0"}`}>
                🔽
              </span>
            </div>

            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                selectedAssureur === assureur ? "max-h-screen opacity-100 scale-100 mt-2" : "max-h-0 opacity-0 scale-95"
              }`}
            >
              <ul>
                {groupedContacts[assureur]?.map((contact) => (
                  <li key={contact.id} className="p-2 border-b transition-all duration-300 hover:bg-gray-100 rounded-md">
                    <strong>📌 {contact.categorie} :</strong> 📞 {contact.telephone} ✉️ {contact.courriel}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Repertoire;
