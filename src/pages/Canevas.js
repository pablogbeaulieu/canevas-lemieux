import { useState, useEffect } from "react";
import { supabase } from "../api"; // Connexion à Supabase
import { motion } from "framer-motion";

function Canevas() {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedCanevas, setSelectedCanevas] = useState(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [needScript, setNeedScript] = useState(false);

  // Champs pour le script d'annulation
  const [clientName, setClientName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [insurerName, setInsurerName] = useState("");

  // Récupération des canevas depuis Supabase
  const fetchCanevas = async () => {
    try {
      const { data, error } = await supabase.from("canevas").select("*");

      if (error) {
        console.error("Erreur lors de la récupération des canevas :", error);
        return;
      }

      // Structuration des données en catégories et sous-catégories
      const formattedData = data.reduce((acc, item) => {
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

    if (isCancellationCanevas(category, subCategory, title)) {
      setSelectedCanevas({ title, content });
      setIsScriptModalOpen(true);
    } else {
      alert("Canevas copié !");
    }
  };

  // Génère le script verbal basé sur les informations saisies
  const generateScript = () => {
    return `À votre demande ${clientName}, je vous confirme que la police d'assurance ${insuranceType} chez ${insurerName} au numéro de police ${policyNumber} sera résiliée à partir du ${cancellationDate}. Lemieux Assurances n'aura plus le mandat d'agir pour vous pour ce contrat d'assurance mentionné, est-ce que c'est bien votre demande?`;
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
            {Object.keys(canevasData[selectedCategory][selectedSubCategory]).map((canevas) => (
              <li key={canevas} className="mb-2">
                <button
                  className="w-full text-left text-lg font-semibold p-2 border rounded bg-gray-200 hover:bg-blue-500 hover:text-white transition"
                  onClick={() =>
                    handleCanevasClick(
                      selectedCategory,
                      selectedSubCategory,
                      canevas,
                      canevasData[selectedCategory][selectedSubCategory][canevas]
                    )
                  }
                >
                  {canevas}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pop-up pour le script d'annulation */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">📢 Script Verbal d'Annulation</h2>

            {!needScript ? (
              <>
                <p>Avez-vous besoin d'un script verbal ?</p>
                <button onClick={() => setNeedScript(true)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Oui
                </button>
                <button onClick={() => setIsScriptModalOpen(false)} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-2">
                  Non
                </button>
              </>
            ) : (
              <>
                <input type="text" placeholder="Nom du client" className="w-full p-2 border rounded mb-2" onChange={(e) => setClientName(e.target.value)} />
                <input type="text" placeholder="Numéro de police" className="w-full p-2 border rounded mb-2" onChange={(e) => setPolicyNumber(e.target.value)} />
                <input type="text" placeholder="Date de résiliation" className="w-full p-2 border rounded mb-2" onChange={(e) => setCancellationDate(e.target.value)} />
                <input type="text" placeholder="Type d'assurance" className="w-full p-2 border rounded mb-2" onChange={(e) => setInsuranceType(e.target.value)} />
                <input type="text" placeholder="Nom de l’assureur" className="w-full p-2 border rounded mb-2" onChange={(e) => setInsurerName(e.target.value)} />

                <textarea className="w-full p-2 border rounded" readOnly rows="8" value={generateScript()} />
                <button onClick={() => setIsScriptModalOpen(false)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Canevas;
