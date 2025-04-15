import { useState, useEffect } from "react";
import { supabase } from "../api"; // Connexion à Supabase
import { motion } from "framer-motion";

function Canevas() {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(""); // Nouveau message de notification

  // Champs pour le script d'annulation
  const [clientName, setClientName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [insurerName, setInsurerName] = useState("");

  const fetchCanevas = async () => {
    try {
      const { data, error } = await supabase.from("canevas").select("*");

      if (error) {
        console.error("Erreur lors de la récupération des canevas :", error);
        return;
      }

      // 🔴 1. Supprimer les canevas avec un titre vide ou null
      const invalidCanevas = data.filter((item) => !item.title || item.title.trim() === "");
      for (const bad of invalidCanevas) {
        await supabase.from("canevas").delete().eq("id", bad.id);
      }

      // 🔴 2. Supprimer les canevas avec une sous-catégorie vide ou null
      const invalidSubCats = data.filter((item) => !item.subCategory || item.subCategory.trim() === "");
      for (const bad of invalidSubCats) {
        await supabase.from("canevas").delete().eq("id", bad.id);
      }

      // 🔄 3. Nettoyer les canevas valides
      const cleanedData = data.filter(
        (item) =>
          item.title && item.title.trim() !== "" &&
          item.subCategory && item.subCategory.trim() !== ""
      );

      const formattedData = cleanedData.reduce((acc, item) => {
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

  // Vérifie si le canevas sélectionné est un canevas d'annulation
  const isCancellationCanevas = (category, subCategory, title) => {
    return category === "ANNU" && subCategory === "TOUS" && title.includes("Annulation");
  };

  // Gestion du clic sur un canevas
  const handleCanevasClick = (category, subCategory, title, content) => {
    navigator.clipboard.writeText(content); // Copie le canevas

    // Afficher la notification de confirmation
    setCopiedMessage("Canevas copié !");
    setTimeout(() => {
      setCopiedMessage(""); // Effacer le message après 2 secondes
    }, 2000);
  };

  // Génère le script verbal basé sur les informations saisies
  const generateScript = () => {
    return `À votre demande ${clientName}, je vous confirme que la police d'assurance ${insuranceType} chez ${insurerName} au numéro de police ${policyNumber} sera résiliée à partir du ${cancellationDate}. Lemieux Assurances n'aura plus le mandat d'agir pour vous pour ce contrat d'assurance mentionné, est-ce que c'est bien votre demande?`;
  };

  // Génère le courriel basé sur les informations saisies
  const generateEmail = () => {
    return `Numéro de la police d’assurance: ${policyNumber}
Assureur: ${insurerName}
Date de résiliation: ${cancellationDate}

Bonjour ${clientName},

À la suite des instructions reçues de votre part, nous vous confirmons que la police ci-haut mentionnée a été résiliée. 

Par conséquent, nous vous avisons que nous mettons fin à notre mandat d’agir pour vous à titre de courtier en assurance de dommages pour la police mentionnée en titre.
Soyez ainsi informé(e) que nous ne ferons aucune démarche auprès d’autres assureurs pour vous procurer une autre police d’assurance.

Dans l’intervalle, et si besoin était, nous demeurons disponibles.

Bien à vous,`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white"
    >
      <h1 className="text-3xl font-bold text-blue-600 mt-4">Répertoire de Canevas</h1>

      {/* Affichage de la notification */}
      {copiedMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-2 rounded-md shadow-lg">
          {copiedMessage}
        </div>
      )}

      {/* Affichage des catégories */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold">📁 Catégories :</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.keys(canevasData).map((category) => (
            <button
              key={category}
              className={`p-2 border rounded ${selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200"} hover:scale-102 hover:shadow-md transition`}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedSubCategory(null);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Affichage des sous-catégories */}
      {selectedCategory && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">📂 Sous-catégories :</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.keys(canevasData[selectedCategory]).map((subCategory) => (
              <button
                key={subCategory}
                className={`p-2 border rounded ${selectedSubCategory === subCategory ? "bg-green-500 text-white" : "bg-gray-200"} hover:scale-102 hover:shadow-md transition`}
                onClick={() => setSelectedSubCategory(subCategory)}
              >
                {subCategory}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Affichage des canevas */}
      {selectedSubCategory && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">📜 Canevas :</h2>
          <ul>
            {Object.entries(canevasData[selectedCategory]?.[selectedSubCategory] || {})
              .filter(([canevas]) => canevas && canevas.trim() !== "")
              .map(([canevas, content]) => {
                const isTableauComparatif =
                  selectedCategory === "BATEAUX" &&
                  selectedSubCategory === "Tous" &&
                  canevas.trim().toLowerCase() === "tableau comparatif";

                return (
                  <li key={canevas} className="mb-2">
                    {isTableauComparatif ? (
                      <a
                        href="https://lemieuxassurance-my.sharepoint.com/:x:/g/personal/pablo_beaulieu_lemieuxassurances_com/EdwMKQ9SzOtLv69Ny-a8jNYBpP9TPgCYxqom8spHJRlAIA?e=HMIfTI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left text-lg font-semibold p-2 border rounded bg-blue-100 hover:bg-blue-200 hover:text-blue-800 transition"
                      >
                        {canevas} 🔗
                      </a>
                    ) : (
                      <button
                        className="w-full text-left text-lg font-semibold p-2 border rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition"
                        onClick={() =>
                          handleCanevasClick(
                            selectedCategory,
                            selectedSubCategory,
                            canevas,
                            content
                          )
                        }
                      >
                        {canevas}
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

export default Canevas;
