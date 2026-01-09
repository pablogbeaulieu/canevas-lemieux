import { useState, useEffect } from "react";
import { supabase } from "../api";
import { motion } from "framer-motion";

function Canevas({ sector = "particulier" }) {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [selectedCanevas, setSelectedCanevas] = useState(null);

  const [clientName, setClientName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [insurerName, setInsurerName] = useState("");

  const fetchCanevas = async () => {
    try {
      // 1) On ne récupère que les canevas du secteur demandé
      const { data, error } = await supabase.from("canevas").select("*").eq("sector", sector);

      if (error) {
        console.error("Erreur lors de la récupération des canevas :", error);
        return;
      }

      // 2) Nettoyage : on ne supprime que dans CE secteur
      const invalidCanevas = (data || []).filter((item) => !item.title?.trim());
      const invalidSubCats = (data || []).filter((item) => !item.subCategory?.trim());

      for (const bad of [...invalidCanevas, ...invalidSubCats]) {
        if (!bad?.id) continue;
        await supabase.from("canevas").delete().eq("id", bad.id).eq("sector", sector);
      }

      const cleanedData = (data || []).filter((item) => item.title?.trim() && item.subCategory?.trim());

      const formattedData = cleanedData.reduce((acc, item) => {
        const { category, subCategory, title, content } = item;

        if (!acc[category]) acc[category] = {};
        if (!acc[category][subCategory]) acc[category][subCategory] = {};
        acc[category][subCategory][title] = content;

        return acc;
      }, {});

      setCanevasData(formattedData);

      // 3) Reset sélections (surtout si on switch de secteur)
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des canevas :", error);
    }
  };

  useEffect(() => {
    fetchCanevas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector]);

  const isCancellationCanevas = (category, subCategory, title) => {
    return category === "ANNU" && subCategory === "TOUS" && title.includes("Annulation");
  };

  const handleCanevasClick = (category, subCategory, title, content) => {
    navigator.clipboard.writeText(content);

    if (isCancellationCanevas(category, subCategory, title)) {
      setSelectedCanevas({ title, content });
      setIsScriptModalOpen(true);
    } else {
      setCopiedMessage("Canevas copié !");
      setTimeout(() => setCopiedMessage(""), 2000);
    }
  };

  const generateScript = () => {
    return `À votre demande ${clientName}, je vous confirme que la police d'assurance ${insuranceType} chez ${insurerName} au numéro de police ${policyNumber} sera résiliée à partir du ${cancellationDate}. Lemieux Assurances n'aura plus le mandat d'agir pour vous pour ce contrat d'assurance mentionné, est-ce que c'est bien votre demande?`;
  };

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

  const pageTitle = sector === "entreprise" ? "Répertoire de canevas — Entreprise" : "Répertoire de canevas — Particulier";
  const pageSubtitle =
    sector === "entreprise"
      ? "Accède rapidement aux canevas et scripts pour les dossiers commerciaux."
      : "Accède rapidement aux canevas et scripts pour les dossiers des particuliers.";

  const categoryCount = Object.keys(canevasData || {}).length;
  const subCategoryCount = selectedCategory ? Object.keys(canevasData[selectedCategory] || {}).length : 0;
  const canevasCount = selectedCategory && selectedSubCategory
    ? Object.keys(canevasData[selectedCategory]?.[selectedSubCategory] || {}).length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="p-6 bg-white"
    >
      {/* ✅ Header modernisé (même style que Répertoire) */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{pageTitle}</h1>
            <p className="text-white/80 text-sm mt-1">{pageSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {categoryCount} catégories
            </span>

            {selectedCategory && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                {subCategoryCount} sous-catégories
              </span>
            )}

            {selectedCategory && selectedSubCategory && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                {canevasCount} canevas
              </span>
            )}
          </div>
        </div>
      </div>

      {copiedMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {copiedMessage}
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-xl font-semibold">Catégories</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.keys(canevasData).map((category) => (
            <button
              key={category}
              className={[
                "px-3 py-2 border rounded-lg",
                "transition-all duration-200",
                "hover:shadow-sm hover:-translate-y-[1px]",
                selectedCategory === category ? "bg-blue-600 text-white border-blue-700" : "bg-gray-50 hover:bg-gray-100",
              ].join(" ")}
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

      {selectedCategory && (
        <div className="mt-5">
          <h2 className="text-xl font-semibold">Sous-catégories</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.keys(canevasData[selectedCategory] || {}).map((subCategory) => (
              <button
                key={subCategory}
                className={[
                  "px-3 py-2 border rounded-lg",
                  "transition-all duration-200",
                  "hover:shadow-sm hover:-translate-y-[1px]",
                  selectedSubCategory === subCategory
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-gray-50 hover:bg-gray-100",
                ].join(" ")}
                onClick={() => setSelectedSubCategory(subCategory)}
              >
                {subCategory}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSubCategory && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Canevas</h2>
          <ul className="space-y-2">
            {Object.entries(canevasData[selectedCategory]?.[selectedSubCategory] || {})
              .filter(([canevas]) => canevas && canevas.trim() !== "")
              .map(([canevas, content]) => {
                const isTableauComparatif =
                  selectedCategory === "BATEAUX" &&
                  selectedSubCategory === "Tous" &&
                  canevas.trim().toLowerCase() === "tableau comparatif";

                return (
                  <li key={canevas}>
                    {isTableauComparatif ? (
                      <a
                        href="https://lemieuxassurance-my.sharepoint.com/:x:/g/personal/pablo_beaulieu_lemieuxassurances_com/EdwMKQ9SzOtLv69Ny-a8jNYBpP9TPgCYxqom8spHJRlAIA?e=HMIfTI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left text-base sm:text-lg font-semibold p-3 border rounded-xl bg-blue-50 hover:bg-blue-100 hover:text-blue-900 transition"
                      >
                        {canevas} 🔗
                      </a>
                    ) : (
                      <button
                        className="w-full text-left text-base sm:text-lg font-semibold p-3 border rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white transition"
                        onClick={() =>
                          handleCanevasClick(selectedCategory, selectedSubCategory, canevas, content)
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

      {isScriptModalOpen && selectedCanevas && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl flex gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Script verbal d'annulation</h2>
              <input
                type="text"
                placeholder="Nom du client"
                className="w-full p-2 border rounded mb-2"
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Numéro de police"
                className="w-full p-2 border rounded mb-2"
                onChange={(e) => setPolicyNumber(e.target.value)}
              />
              <input
                type="text"
                placeholder="Date de résiliation"
                className="w-full p-2 border rounded mb-2"
                onChange={(e) => setCancellationDate(e.target.value)}
              />
              <input
                type="text"
                placeholder="Type d'assurance"
                className="w-full p-2 border rounded mb-2"
                onChange={(e) => setInsuranceType(e.target.value)}
              />
              <input
                type="text"
                placeholder="Nom de l’assureur"
                className="w-full p-2 border rounded mb-2"
                onChange={(e) => setInsurerName(e.target.value)}
              />

              <textarea
                className="w-full p-2 border rounded mb-2"
                readOnly
                rows="9"
                value={generateScript()}
              />

              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Fermer
              </button>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Courriel de confirmation</h2>
              <textarea className="w-full p-2 border rounded mb-2" rows="25" readOnly value={generateEmail()} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateEmail());
                  setCopiedMessage("Courriel copié !");
                  setTimeout(() => setCopiedMessage(""), 2000);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Copier
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Canevas;
