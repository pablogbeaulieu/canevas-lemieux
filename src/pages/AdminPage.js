import { useState, useEffect } from "react";
import { supabase } from "../api"; // Connexion à Supabase

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  // États pour les catégories
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryEditValue, setCategoryEditValue] = useState("");

  // États pour les sous-catégories
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryEditValue, setSubCategoryEditValue] = useState("");

  // 🔹 Récupère les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("canevas").select("category");
      if (error) {
        console.error("❌ Erreur chargement catégories :", error);
        return;
      }
      setCategories([...new Set(data.map((item) => item.category))]);
    };
    if (showCategoryModal || showSubCategoryModal) fetchCategories();
  }, [showCategoryModal, showSubCategoryModal]);

  // 🔹 Récupère les sous-catégories
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory) return;
      const { data, error } = await supabase
        .from("canevas")
        .select("subCategory")
        .eq("category", selectedCategory);
      if (error) {
        console.error("❌ Erreur chargement sous-catégories :", error);
        return;
      }
      setSubCategories([...new Set(data.map((item) => item.subCategory))]);
    };

    if (showSubCategoryModal) fetchSubCategories();
  }, [showSubCategoryModal, selectedCategory]);

  // 🔹 Ajouter une catégorie
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from("canevas").insert([{ category: newCategory }]);
    if (!error) {
      setNewCategory("");
      setCategories([...categories, newCategory]);
    }
  };

  // 🔹 Modifier une catégorie
  const updateCategory = async (oldCategory, newCategoryName) => {
    if (!newCategoryName.trim()) return;
    await supabase
      .from("canevas")
      .update({ category: newCategoryName })
      .eq("category", oldCategory);
    setCategories(categories.map(cat => (cat === oldCategory ? newCategoryName : cat)));
    setEditingCategory(null);
  };

  // 🔹 Supprimer une catégorie
  const deleteCategory = async (categoryToDelete) => {
    if (!categoryToDelete) return;
    await supabase.from("canevas").delete().eq("category", categoryToDelete);
    setCategories(categories.filter(cat => cat !== categoryToDelete));
  };

  // 🔹 Ajouter une sous-catégorie
  const addSubCategory = async () => {
    if (!selectedCategory || !newSubCategory.trim()) return;
    await supabase.from("canevas").insert([
      { category: selectedCategory, subCategory: newSubCategory },
    ]);
    setNewSubCategory("");
    setSubCategories([...subCategories, newSubCategory]);
  };

  // 🔹 Modifier une sous-catégorie
  const updateSubCategory = async (oldSubCategory, newSubCategoryName) => {
    if (!newSubCategoryName.trim()) return;
    await supabase
      .from("canevas")
      .update({ subCategory: newSubCategoryName })
      .eq("category", selectedCategory)
      .eq("subCategory", oldSubCategory);
  };

  // 🔹 Supprimer une sous-catégorie
  const deleteSubCategory = async (subCategoryToDelete) => {
    if (!selectedCategory || !subCategoryToDelete) return;
    await supabase
      .from("canevas")
      .delete()
      .eq("category", selectedCategory)
      .eq("subCategory", subCategoryToDelete);
    setSubCategories(subCategories.filter(sub => sub !== subCategoryToDelete));
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Panneau d'administration</h1>

      {/* Boutons pour ouvrir les pop-ups */}
      <button onClick={() => setShowCategoryModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Modifier les Catégories
      </button>
      <button onClick={() => setShowSubCategoryModal(true)} className="ml-4 bg-blue-500 text-white px-4 py-2 rounded mb-4">
        Modifier les Sous-Catégories
      </button>

      {/* Pop-up gestion des catégories */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">📜 Gestion des Catégories</h2>

            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nouvelle catégorie" className="p-2 border rounded w-full"/>
            <button onClick={addCategory} className="w-full bg-green-500 text-white px-4 py-2 rounded mt-2">Ajouter</button>

            {categories.map((cat, index) => (
              <div key={index} className="flex justify-between items-center mt-2">
                <span>{cat}</span>
                <button onClick={() => deleteCategory(cat)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
              </div>
            ))}

            <button onClick={() => setShowCategoryModal(false)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Fermer</button>
          </div>
        </div>
      )}

      {/* Pop-up gestion des sous-catégories */}
      {showSubCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-3xl">
            <h2 className="text-2xl font-semibold mb-4">📂 Gestion des Sous-Catégories</h2>

            <select onChange={(e) => setSelectedCategory(e.target.value)} className="p-2 border rounded w-full mb-4">
              <option value="">Choisir une catégorie</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>{cat}</option>
              ))}
            </select>

            <input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="Nouvelle sous-catégorie" className="p-2 border rounded w-full"/>
            <button onClick={addSubCategory} className="w-full bg-green-500 text-white px-4 py-2 rounded mt-2">Ajouter</button>

            {subCategories.map((sub, index) => (
              <div key={index} className="flex justify-between items-center mt-2">
                <span>{sub}</span>
                <button onClick={() => deleteSubCategory(sub)} className="bg-red-500 text-white px-2 py-1 rounded">Supprimer</button>
              </div>
            ))}

            <button onClick={() => setShowSubCategoryModal(false)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
