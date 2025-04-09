import { useState, useEffect } from "react";
import { supabase } from "../api";
import { motion, AnimatePresence } from "framer-motion";

function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [canevasList, setCanevasList] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newCanevasTitle, setNewCanevasTitle] = useState("");
  const [newCanevasContent, setNewCanevasContent] = useState("");

  const [editingCanevasId, setEditingCanevasId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [users, setUsers] = useState([]);
const [showUserManagement, setShowUserManagement] = useState(false);

const [suggestions, setSuggestions] = useState([]);
const [showSuggestionsSection, setShowSuggestionsSection] = useState(false);

const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, isApproved, last_active"); // 👈 On ajoute last_active ici

  if (!error) {
    setUsers(data);
  }
};

const fetchSuggestions = async () => {
  const { data, error } = await supabase
    .from("suggestions")
    .select("id, category, content, created_at, users(email)")
    .order("created_at", { ascending: false });

  if (!error) {
    setSuggestions(data);
  } else {
    console.error("Erreur lors du chargement des suggestions :", error);
  }
};

  // État pour les sections rétractables
  const [showCanevasSection, setShowCanevasSection] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("canevas").select("category");
    if (!error) {
      const unique = [...new Set(data.map(item => item.category))];
      setCategories(unique);
    }
  };

  const fetchSubCategories = async () => {
    if (!selectedCategory) return;
    const { data, error } = await supabase
      .from("canevas")
      .select("subCategory")
      .eq("category", selectedCategory);
    if (!error) {
      const unique = [...new Set(data.map(item => item.subCategory))];
      setSubCategories(unique);
    }
  };

  const fetchCanevas = async () => {
    if (!selectedCategory || !selectedSubCategory) return;
    const { data, error } = await supabase
      .from("canevas")
      .select("*")
      .eq("category", selectedCategory)
      .eq("subCategory", selectedSubCategory);
    if (!error) setCanevasList(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubCategories();
    setSelectedSubCategory("");
    setCanevasList([]);
  }, [selectedCategory]);

  useEffect(() => {
    fetchCanevas();
  }, [selectedSubCategory]);

  useEffect(() => {
    if (showSuggestionsSection) {
      fetchSuggestions();
    }
  }, [showSuggestionsSection]);  

  useEffect(() => {
    if (showUserManagement) {
      fetchUsers();
    }
  }, [showUserManagement]);  

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await supabase.from("canevas").insert([{ category: newCategory, subCategory: "-", title: "-", content: "-" }]);
    setNewCategory("");
    fetchCategories();
  };

  const deleteCategory = async (cat) => {
    await supabase.from("canevas").delete().eq("category", cat);
    fetchCategories();
  };

  const addSubCategory = async () => {
    if (!selectedCategory || !newSubCategory.trim()) return;
    await supabase
      .from("canevas")
      .insert([{ category: selectedCategory, subCategory: newSubCategory }]);
    setNewSubCategory("");
    fetchSubCategories();
  };

  const deleteSubCategory = async (sub) => {
    await supabase
      .from("canevas")
      .delete()
      .eq("category", selectedCategory)
      .eq("subCategory", sub);
    fetchSubCategories();
  };

  const addCanevas = async () => {
    if (!selectedCategory || !selectedSubCategory || !newCanevasTitle.trim()) return;
    await supabase.from("canevas").insert([
      {
        category: selectedCategory,
        subCategory: selectedSubCategory,
        title: newCanevasTitle,
        content: newCanevasContent,
      },
    ]);
    setNewCanevasTitle("");
    setNewCanevasContent("");
    fetchCanevas();
  };

  const deleteCanevas = async (id) => {
    await supabase.from("canevas").delete().eq("id", id);
    fetchCanevas();
  };

  const startEditing = (canevas) => {
    setEditingCanevasId(canevas.id);
    setEditedTitle(canevas.title);
    setEditedContent(canevas.content);
  };

  const cancelEditing = () => {
    setEditingCanevasId(null);
    setEditedTitle("");
    setEditedContent("");
  };

  const deleteSuggestion = async (id) => {
    await supabase.from("suggestions").delete().eq("id", id);
    fetchSuggestions();
  };  

  const saveCanevasChanges = async () => {
    if (!editedTitle.trim()) {
      alert("Le titre ne peut pas être vide.");
      return;
    }


    const { error } = await supabase
      .from("canevas")
      .update({ title: editedTitle.trim(), content: editedContent })
      .eq("id", editingCanevasId);

    if (error) {
      alert("❌ Erreur lors de la mise à jour.");
      console.error(error);
      return;
    }

    cancelEditing();
    fetchCanevas();
    alert("✅ Canevas mis à jour !");
  };

  const approveUser = async (userId) => {
    await supabase.from("users").update({ isApproved: true }).eq("id", userId);
    fetchUsers();
  };
  
  const disapproveUser = async (userId) => {
    await supabase.from("users").update({ isApproved: false }).eq("id", userId);
    fetchUsers();
  };   

  const getLastActiveText = (timestamp) => {
    if (!timestamp) return { text: "Dernière activité inconnue", isOnline: false };
  
    const last = new Date(timestamp);
    const now = new Date();
    const diffMs = now - last;
    const diffMin = Math.floor(diffMs / 1000 / 60);
  
    if (diffMin < 1) return { text: "En ligne maintenant", isOnline: true };
    if (diffMin === 1) return { text: "Il y a 1 minute", isOnline: false };
    if (diffMin < 60) return { text: `Il y a ${diffMin} minutes`, isOnline: false };
  
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return { text: "Il y a 1 heure", isOnline: false };
    if (diffHr < 24) return { text: `Il y a ${diffHr} heures`, isOnline: false };
  
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return { text: "Il y a 1 jour", isOnline: false };
    return { text: `Il y a ${diffDay} jours`, isOnline: false };
  };   

  return (
    <div className="p-10">
   <h1 className="text-3xl font-bold mb-6 text-blue-700">🛠️ Panneau d'administration</h1>

{/* BOUTONS PRINCIPAUX ALIGNÉS */}
<div className="flex flex-col sm:flex-row gap-4 mb-6">
  <button
    onClick={() => setShowUserManagement(!showUserManagement)}
    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
  >
    {showUserManagement ? "🔽 Cacher la gestion des utilisateurs" : "👥 Gestion des utilisateurs"}
  </button>

  <button
    onClick={() => setShowCanevasSection(!showCanevasSection)}
    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
  >
    {showCanevasSection ? "🔽 Cacher la gestion des canevas" : "📋 Gestion des canevas"}
  </button>

  <button
    onClick={() => setShowSuggestionsSection(!showSuggestionsSection)}
    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
  >
    {showSuggestionsSection ? "🔽 Cacher les suggestions" : "📨 Gérer les suggestions"}
  </button>
</div>

{/* Gestion des utilisateurs */}
<AnimatePresence>
  {showUserManagement && (
    <motion.div
      key="user-management"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8 border rounded p-4 bg-gray-50 overflow-hidden"
    >
      <h2 className="text-xl font-semibold mb-4">👥 Liste des utilisateurs</h2>
      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id} className="flex justify-between items-center py-2 border-b">
{(() => {
  const { text, isOnline } = getLastActiveText(user.last_active);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span>{user.email}</span>
        <span
          className={`h-2 w-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-red-400"
          }`}
          title={text}
        ></span>
      </div>
      <div className="text-sm text-gray-500">{text}</div>
    </div>
  );
})()}
              <div className="flex gap-2">
                {user.isApproved ? (
                  <button
                    onClick={() => disapproveUser(user.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    ❌ Désapprouver
                  </button>
                ) : (
                  <button
                    onClick={() => approveUser(user.id)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    ✅ Approuver
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )}
</AnimatePresence>

      {/* SECTION RÉTRACTABLE : GESTION DES CANEVAS */}
      <div className="mb-6">
      <AnimatePresence>
  {showCanevasSection && (
    <motion.div
      key="canevas-section"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 overflow-hidden"
    >

            {/* Catégories */}
            <h2 className="text-2xl font-semibold mb-2">📁 Catégories</h2>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="p-2 border rounded w-full mb-2"
            />
            <button onClick={addCategory} className="bg-green-500 text-white px-4 py-2 rounded w-full mb-4">
              ➕ Ajouter la catégorie
            </button>
            <ul className="mb-8">
              {categories.map((cat, idx) => (
                <li key={idx} className="flex justify-between items-center border-b py-1">
                  <span>{cat}</span>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>

            {/* Sous-catégories */}
            <h2 className="text-2xl font-semibold mb-2">📂 Sous-catégories</h2>
            <select
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
              className="p-2 border rounded w-full mb-2"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {selectedCategory && (
              <>
                <select
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  value={selectedSubCategory}
                  className="p-2 border rounded w-full mb-2"
                >
                  <option value="">Choisir une sous-catégorie</option>
                  {subCategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                <input
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  placeholder="Nouvelle sous-catégorie"
                  className="p-2 border rounded w-full mb-2"
                />
                <button onClick={addSubCategory} className="bg-green-500 text-white px-4 py-2 rounded w-full mb-4">
                  ➕ Ajouter la sous-catégorie
                </button>

                <ul className="mb-8">
                  {subCategories.map((sub, idx) => (
                    <li key={idx} className="flex justify-between items-center border-b py-1">
                      <span>{sub}</span>
                      <button
                        onClick={() => deleteSubCategory(sub)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Canevas */}
            {selectedCategory && selectedSubCategory && (
              <div>
                <h2 className="text-2xl font-semibold mb-2">📜 Canevas</h2>
                <input
                  value={newCanevasTitle}
                  onChange={(e) => setNewCanevasTitle(e.target.value)}
                  placeholder="Titre du canevas"
                  className="p-2 border rounded w-full mb-2"
                />
                <textarea
                  value={newCanevasContent}
                  onChange={(e) => setNewCanevasContent(e.target.value)}
                  placeholder="Contenu"
                  className="p-2 border rounded w-full mb-2"
                  rows={4}
                />
                <button onClick={addCanevas} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
                  ➕ Ajouter le canevas
                </button>

                <ul className="mt-4">
                  {canevasList.map((canevas) => (
                    <li key={canevas.id} className="border-b py-2">
                      {editingCanevasId === canevas.id ? (
                        <div>
                          <input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="p-2 border rounded w-full mb-2"
                          />
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="p-2 border rounded w-full mb-2"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button onClick={saveCanevasChanges} className="bg-green-500 text-white px-4 py-1 rounded">✅ Sauvegarder</button>
                            <button onClick={cancelEditing} className="bg-gray-500 text-white px-4 py-1 rounded">❌ Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <strong>{canevas.title}</strong>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(canevas)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => deleteCanevas(canevas.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showSuggestionsSection && (
    <motion.div
      key="suggestions-section"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 overflow-hidden bg-gray-50 border p-4 rounded"
    >
      <h2 className="text-xl font-semibold mb-4 text-blue-700">📨 Suggestions reçues</h2>

      {suggestions.length === 0 ? (
        <p className="text-gray-500 italic">Aucune suggestion pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {suggestions.map((sugg) => (
            <li key={sugg.id} className="border-b pb-3">
              <div className="text-sm text-gray-600 mb-1">
                <strong>Type :</strong> {sugg.category} | <strong>Par :</strong> {sugg.users?.email || "Inconnu"}
              </div>
              <p className="text-gray-800 mb-2">{sugg.content}</p>
              <div className="text-xs text-gray-500 mb-2">
                Reçue le {new Date(sugg.created_at).toLocaleString("fr-CA")}
              </div>
              <button
                onClick={() => deleteSuggestion(sugg.id)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )}
</AnimatePresence>
      </div>
    </div>
  );
}

export default AdminPage;
