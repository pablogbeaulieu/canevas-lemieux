import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

function Canevas() {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAction, setEditAction] = useState("");
  const [itemType, setItemType] = useState("category");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const fetchCanevas = async () => {
    try {
      const response = await axios.get("http://localhost:5000/canevas");
      const formattedData = response.data.reduce((acc, item) => {
        const { category, subCategory, title, content } = item;
        if (!acc[category]) acc[category] = {};
        if (!acc[category][subCategory]) acc[category][subCategory] = {};
        acc[category][subCategory][title] = content;
        return acc;
      }, {});
      setCanevasData(formattedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des canevas :", error);
    }
  };

  useEffect(() => {
    fetchCanevas();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Canevas copié !");
  };

  const openEditModal = (action) => {
    setEditAction(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditAction("");
    setNewTitle("");
    setNewContent("");
    setItemType("category");
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) {
      alert("Le nom ne peut pas être vide.");
      return;
    }
  
    let body = {
      category: itemType === "category" ? newTitle : selectedCategory,
      subCategory: itemType === "subCategory" ? newTitle : selectedSubCategory,
      title: itemType === "canevas" ? newTitle : "",
      content: itemType === "canevas" ? newContent : "",
    };
  
    try {
      await axios.post("http://localhost:5000/canevas", body);
      fetchCanevas();  // Recharge immédiatement les données
      closeModal();
      alert("✅ Ajout réussi !");
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      alert("❌ Erreur lors de l'ajout.");
    }
  };

  // Variants pour animer l'apparition/disparition des sections
  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-6 ${isEditing ? "bg-blue-100 border border-blue-300" : "bg-white"}`}
    >
      {isAdmin && (
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded text-white ${isEditing ? "bg-red-500" : "bg-blue-500"} hover:opacity-80 transition`}
        >
          {isEditing ? "Désactiver le Mode Édition" : "🛠️ Activer le Mode Édition"}
        </button>
      )}

      {isEditing && (
        <button
          onClick={() => openEditModal("add")}
          className="mt-4 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition"
        >
          ➕ Ajouter
        </button>
      )}

      <h1 className="text-3xl font-bold text-blue-600 mt-4">Répertoire de Canevas</h1>

      {/* Affichage des catégories */}
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={sectionVariants}
        className="mt-4"
      >
        <h2 className="text-xl font-semibold">📁 Catégories :</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.keys(canevasData).map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 border rounded ${
                selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200"
              } transition`}
              onClick={() => {
                setSelectedCategory(category === selectedCategory ? null : category);
                setSelectedSubCategory(null);
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Affichage des sous-catégories */}
      <AnimatePresence>
        {selectedCategory && canevasData[selectedCategory] && (
          <motion.div
            key="subcategories"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sectionVariants}
            className="mt-4"
          >
            <h2 className="text-xl font-semibold">📂 Sous-catégories :</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.keys(canevasData[selectedCategory]).map((subCategory) => (
                <motion.button
                  key={subCategory}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 border rounded ${
                    selectedSubCategory === subCategory ? "bg-green-500 text-white" : "bg-gray-200"
                  } transition`}
                  onClick={() =>
                    setSelectedSubCategory(subCategory === selectedSubCategory ? null : subCategory)
                  }
                >
                  {subCategory}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affichage des canevas avec effet de fade-in */}
      <AnimatePresence>
        {selectedSubCategory && canevasData[selectedCategory][selectedSubCategory] && (
          <motion.div
            key="canevasList"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="mt-4"
          >
            <h2 className="text-xl font-semibold">📜 Canevas :</h2>
            <motion.ul>
              {Object.keys(canevasData[selectedCategory][selectedSubCategory]).map((canevas) => (
                <motion.li
                  key={canevas}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="mb-2"
                >
                  <button
                    className="w-full text-left text-lg font-semibold p-2 border rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition"
                    onClick={() =>
                      handleCopy(canevasData[selectedCategory][selectedSubCategory][canevas])
                    }
                  >
                    {canevas}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up d'édition */}
      {isModalOpen && editAction === "add" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">➕ Ajouter un élément</h2>
            <input
              type="text"
              placeholder="Nom"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button onClick={handleAddItem} className="px-4 py-2 bg-blue-500 text-white rounded">
              ✅ Ajouter
            </button>
            <button onClick={closeModal} className="ml-2 px-4 py-2 bg-gray-500 text-white rounded">
              ❌ Annuler
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Canevas;
