import { useState, useEffect } from "react";
import { supabase } from "../api"; // Utilisation de Supabase pour récupérer les données
import { motion } from "framer-motion";

function Canevas() {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Fonction pour récupérer les canevas depuis Supabase
  const fetchCanevas = async () => {
    try {
      const { data, error } = await supabase.from("canevas").select("*"); // Assure-toi que tu as bien la table "canevas" dans Supabase

      if (error) {
        console.error("Erreur lors de la récupération des canevas :", error);
        return;
      }

      // Formater les données pour les catégories et sous-catégories
      const formattedData = data.reduce((acc, item) => {
        const { category, subCategory, title, content } = item;
        if (!acc[category]) acc[category] = {};
        if (!acc[category][subCategory]) acc[category][subCategory] = {};
        acc[category][subCategory][title] = content;
        return acc;
      }, {});

      setCanevasData(formattedData); // Mettre à jour l'état des canevas
    } catch (error) {
      console.error("Erreur lors de la récupération des canevas :", error);
    }
  };

  // Charger les canevas lors du premier rendu
  useEffect(() => {
    fetchCanevas();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Canevas copié !");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white"
    >
      <h1 className="text-3xl font-bold text-blue-600 mt-4">Répertoire de Canevas</h1>

      {/* Affichage des catégories */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold">📁 Catégories :</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.keys(canevasData).map((category) => (
            <button
              key={category}
              className={`p-2 border rounded ${selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200"} hover:scale-102 hover:shadow-md transition`}
              onClick={() => {
                setSelectedCategory(category === selectedCategory ? null : category);
                setSelectedSubCategory(null);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Affichage des sous-catégories */}
      {selectedCategory && canevasData[selectedCategory] && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">📂 Sous-catégories :</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.keys(canevasData[selectedCategory]).map((subCategory) => (
              <button
                key={subCategory}
                className={`p-2 border rounded ${selectedSubCategory === subCategory ? "bg-green-500 text-white" : "bg-gray-200"} hover:scale-102 hover:shadow-md transition`}
                onClick={() => setSelectedSubCategory(subCategory === selectedSubCategory ? null : subCategory)}
              >
                {subCategory}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Affichage des canevas */}
      {selectedSubCategory && canevasData[selectedCategory][selectedSubCategory] && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">📜 Canevas :</h2>
          <ul>
            {Object.keys(canevasData[selectedCategory][selectedSubCategory]).map((canevas) => (
              <li key={canevas} className="mb-2">
                <button
                  className="w-full text-left text-lg font-semibold p-2 border rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition"
                  onClick={() => handleCopy(canevasData[selectedCategory][selectedSubCategory][canevas])}
                >
                  {canevas}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

export default Canevas;
