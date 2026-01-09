import { useState, useEffect } from "react";
import { supabase } from "../api"; // 📌 Connexion à Supabase

function Repertoire() {
  const [contacts, setContacts] = useState([]);
  const [assureurs, setAssureurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedAssureur, setSelectedAssureur] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // États pour l'ajout d'un contact
  const [newAssureur, setNewAssureur] = useState("");
  const [newCategorie, setNewCategorie] = useState("");
  const [newTelephone, setNewTelephone] = useState("");
  const [newCourriel, setNewCourriel] = useState("");
  const [isNewAssureur, setIsNewAssureur] = useState(false);

  // États d’édition
  const [editingId, setEditingId] = useState(null);
  const [editedCategorie, setEditedCategorie] = useState("");
  const [editedTelephone, setEditedTelephone] = useState("");
  const [editedCourriel, setEditedCourriel] = useState("");

  useEffect(() => {
    fetchContacts();
    fetchAssureurs();
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("repertoire")
      .select("*")
      .order("assureur", { ascending: true });

    if (!error) setContacts(data || []);
    setLoading(false);
  };

  const fetchAssureurs = async () => {
    const { data, error } = await supabase
      .from("repertoire")
      .select("assureur")
      .order("assureur", { ascending: true });

    if (!error) {
      const uniqueAssureurs = [...new Set((data || []).map((item) => item.assureur))];
      setAssureurs(uniqueAssureurs);
    }
  };

  const fetchUserRole = async () => {
    const { data } = await supabase.auth.getUser();
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

  const addContact = async () => {
    const assureurFinal = isNewAssureur ? newAssureur.trim() : newAssureur;

    if (!assureurFinal || !newCategorie || !newTelephone || !newCourriel) {
      alert("Tous les champs sont obligatoires !");
      return;
    }

    const { error } = await supabase.from("repertoire").insert([
      {
        assureur: assureurFinal,
        categorie: newCategorie,
        telephone: newTelephone,
        courriel: newCourriel,
      },
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

  const startEditing = (contact) => {
    setEditingId(contact.id);
    setEditedCategorie(contact.categorie);
    setEditedTelephone(contact.telephone);
    setEditedCourriel(contact.courriel);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedCategorie("");
    setEditedTelephone("");
    setEditedCourriel("");
  };

  const saveEdits = async () => {
    const { error } = await supabase
      .from("repertoire")
      .update({
        categorie: editedCategorie,
        telephone: editedTelephone,
        courriel: editedCourriel,
      })
      .eq("id", editingId);

    if (!error) {
      fetchContacts();
      cancelEditing();
    }
  };

  const deleteContact = async (id) => {
    const confirmDelete = window.confirm("❌ Supprimer ce contact ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("repertoire").delete().eq("id", id);
    if (!error) fetchContacts();
  };

  const deleteAssureur = async (assureurName) => {
    const confirmDelete = window.confirm(
      `⚠️ Supprimer l'assureur "${assureurName}" et tous ses contacts ?`
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("repertoire").delete().eq("assureur", assureurName);

    if (!error) {
      fetchContacts();
      fetchAssureurs();
      if (selectedAssureur === assureurName) setSelectedAssureur(null);
    } else {
      alert("❌ Erreur lors de la suppression");
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      {/* ✅ Header modernisé */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold"> Répertoire téléphonique</h1>
            <p className="text-white/80 text-sm mt-1">
              Trouve rapidement les contacts par assureur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {assureurs.length} assureurs
            </span>
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {contacts.length} contacts
            </span>

            {userRole === "admin" && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="ml-1 bg-white text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
              >
                {showAddForm ? "Fermer" : "Ajouter"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Formulaire d'ajout (admins seulement) */}
      {userRole === "admin" && (
        <div className="mb-6">
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showAddForm ? "max-h-[800px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"
            }`}
          >
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              {/* Sélection ou ajout d'un assureur */}
              <div className="mb-3">
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
                        <option key={index} value={assureur}>
                          {assureur}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsNewAssureur(true)}
                      className="text-blue-700 text-sm hover:underline"
                      type="button"
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
                      className="text-red-600 text-sm hover:underline"
                      type="button"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Catégorie"
                  value={newCategorie}
                  onChange={(e) => setNewCategorie(e.target.value)}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Téléphone"
                  value={newTelephone}
                  onChange={(e) => setNewTelephone(e.target.value)}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Courriel"
                  value={newCourriel}
                  onChange={(e) => setNewCourriel(e.target.value)}
                  className="p-2 border rounded w-full sm:col-span-2"
                />
              </div>

              <button
                onClick={addContact}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Chargement des contacts...</p>
      ) : (
        assureurs.map((assureur) => (
          <div key={assureur} className="mb-4">
            {/* ✅ En-tête assureur modernisé */}
            <div
              className="flex justify-between items-center bg-white p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-xl border shadow-sm"
              onClick={() => setSelectedAssureur(selectedAssureur === assureur ? null : assureur)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold">{assureur}</h2>

                {userRole === "admin" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAssureur(assureur);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="Supprimer l’assureur"
                    type="button"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <span
                className={`transform transition-transform duration-200 ${
                  selectedAssureur === assureur ? "rotate-180" : "rotate-0"
                }`}
              >
                🔽
              </span>
            </div>

            {/* ✅ Liste contacts avec transition */}
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                selectedAssureur === assureur
                  ? "max-h-[1200px] opacity-100 scale-100 mt-2"
                  : "max-h-0 opacity-0 scale-95"
              }`}
            >
              <div className="bg-white border rounded-xl shadow-sm">
                <ul className="divide-y">
                  {groupedContacts[assureur]?.map((contact) => (
                    <li
                      key={contact.id}
                      className="p-3 transition-all duration-200 hover:bg-gray-50"
                    >
                      {editingId === contact.id ? (
                        <div className="space-y-2">
                          <input
                            value={editedCategorie}
                            onChange={(e) => setEditedCategorie(e.target.value)}
                            className="p-2 border rounded w-full"
                          />
                          <input
                            value={editedTelephone}
                            onChange={(e) => setEditedTelephone(e.target.value)}
                            className="p-2 border rounded w-full"
                          />
                          <input
                            value={editedCourriel}
                            onChange={(e) => setEditedCourriel(e.target.value)}
                            className="p-2 border rounded w-full"
                          />

                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={saveEdits}
                              className="bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700"
                              type="button"
                            >
                              💾 Enregistrer
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                              type="button"
                            >
                              ✖️ Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="text-sm sm:text-base">
                            <div className="font-semibold">
                              📌 {contact.categorie}
                            </div>
                            <div className="text-gray-700">
                              📞 {contact.telephone}{" "}
                              <span className="mx-2 text-gray-300">|</span>
                              ✉️ {contact.courriel}
                            </div>
                          </div>

                          {userRole === "admin" && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => startEditing(contact)}
                                className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                                type="button"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => deleteContact(contact.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                type="button"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Repertoire;
