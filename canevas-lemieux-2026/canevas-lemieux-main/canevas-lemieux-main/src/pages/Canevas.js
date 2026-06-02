import { useState, useEffect, useMemo, useRef } from "react"; import { supabase } from "../api"; import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

function Canevas({ sector = "particulier" }) {
  const [canevasData, setCanevasData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [selectedCanevas, setSelectedCanevas] = useState(null);

  const [showLegalModal, setShowLegalModal] = useState(false);

  const [clientName, setClientName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [insurerName, setInsurerName] = useState("");

  // ✅ NOUVEAUX ÉTATS POUR LA PROCURATION VERBALE
  const [isProcurationModalOpen, setIsProcurationModalOpen] = useState(false);
  const [assureName, setAssureName] = useState("");
  const [authorizedPerson, setAuthorizedPerson] = useState("");
  const [procurationDate, setProcurationDate] = useState("");

  // ✅ NOUVEAUX ÉTATS POUR "Refus d'augmenter le CVA"
  const [isRefusCVAModalOpen, setIsRefusCVAModalOpen] = useState(false);
  const [refusCVAName, setRefusCVAName] = useState("");

// ✅ NOUVEAUX ÉTATS POUR "Paiement effectué avec assuré"
const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);

const [prime, setPrime] = useState("");
const [commission, setCommission] = useState("");
const [fraisPolice, setFraisPolice] = useState("");
const [honoraires, setHonoraires] = useState("");
const [typeFacturation, setTypeFacturation] = useState("");
const [participation, setParticipation] = useState("");
const [typeEnvoi, setTypeEnvoi] = useState("");
const [mentionSpeciale, setMentionSpeciale] = useState("");

const [isPrequalificationModalOpen, setIsPrequalificationModalOpen] = useState(false);

const [autorisationCredit, setAutorisationCredit] = useState("");
const [antecedentsJudiciaires, setAntecedentsJudiciaires] = useState("");
const [faillite, setFaillite] = useState("");
const [refusAssureur, setRefusAssureur] = useState("");
const [fraudeAssurance, setFraudeAssurance] = useState("");
const [reclamations, setReclamations] = useState("");
const [reclamationsFermees, setReclamationsFermees] = useState("");
const [detailsReclamations, setDetailsReclamations] = useState("");

const [detailsAntecedents, setDetailsAntecedents] = useState("");
const [detailsFaillite, setDetailsFaillite] = useState("");
const [detailsRefusAssureur, setDetailsRefusAssureur] = useState("");
const [detailsFraude, setDetailsFraude] = useState("");
const [notes, setNotes] = useState("");

const isPrequalificationCanevas = (category, subCategory, title) => {
  return title === "Questions légales - Préqualification";
};



  // ✅ Recherche
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();

  const fetchCanevas = async () => {
    try {
      const { data, error } = await supabase
        .from("canevas")
        .select("id, sector, category, subCategory, title, content, usage_count")
        .eq("sector", sector);

      if (error) {
        console.error("Erreur lors de la récupération des canevas :", error);
        return;
      }

      // ✅ Nettoyage
      const invalidCanevas = (data || []).filter((item) => !item.title?.trim());
      const invalidSubCats = (data || []).filter((item) => !item.subCategory?.trim());

      for (const bad of [...invalidCanevas, ...invalidSubCats]) {
        if (!bad?.id) continue;
        await supabase.from("canevas").delete().eq("id", bad.id).eq("sector", sector);
      }

      const cleanedData = (data || []).filter(
        (item) => item.title?.trim() && item.subCategory?.trim()
      );

      const formattedData = cleanedData.reduce((acc, item) => {
        const { category, subCategory, title, content, id, usage_count } = item;

        if (!acc[category]) acc[category] = {};
        if (!acc[category][subCategory]) acc[category][subCategory] = {};

        acc[category][subCategory][title] = {
          id,
          content,
          usage_count: usage_count ?? 0,
        };

        return acc;
      }, {});

      setCanevasData(formattedData);
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

  // ✅ Auto focus quand search open
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      searchInputRef.current?.focus?.();
    }, 50);
    return () => clearTimeout(t);
  }, [searchOpen]);

  const isCancellationCanevas = (category, subCategory, title) => {
    return category === "ANNU" && subCategory === "TOUS" && title.includes("Annulation");
  };

  // ✅ Détecte le canevas "Procuration verbale"
  const isProcurationVerbaleCanevas = (category, subCategory, title) => {
    return title === "Procuration verbale" ||
           title.toLowerCase().includes("procuration verbale");
  };

  // ✅ Détecte le canevas "Refus d'augmenter le CVA"
  const isRefusCVACanevas = (category, subCategory, title) => {
    return title === "Refus d'augmenter le CVA" ||
           title.toLowerCase().includes("refus d'augmenter le cva");
  };

  
// ✅ Détecte le canevas "Paiement effectué avec assuré"
const isPaiementEffectueCanevas = (category, subCategory, title) => {
  return title === "Paiement effectué avec assuré" ||
         title.toLowerCase().includes("paiement effectué avec assuré");
};


  // ====================== TÉLÉCHARGEMENT FICHIERS BOÎTE À OUTILS AGRICOLE ======================
  const handleDownloadAgriculturalTool = (title) => {
    let fileName = "";
    let filePath = "";

    switch (title.trim()) {
      case "Inventaire agricole (court)":
        fileName = "Inventaire_Agricole_Court.xls";
        filePath = "/documents/Inventaire_Agricole_Court.xls";
        break;
      case "Inventaire agricole (long)":
        fileName = "Inventaire_Agricole_Long.xlsx";
        filePath = "/documents/Inventaire_Agricole_Long.xlsx";
        break;
      case "Proposition d'assurance agricole":
        fileName = "Proposition_Assurance_Agricole.docx";
        filePath = "/documents/Proposition_Assurance_Agricole.docx";
        break;
      case "Note de couverture - Équipement agricole":
        fileName = "Note_Couverture_Equipement_Agricole.xlsx";
        filePath = "/documents/Note_Couverture_Equipement_Agricole.xlsx";
        break;
      case "Note de couverture - Automobile":
        fileName = "Note_Couverture_Automobile_Agricole.doc";
        filePath = "/documents/Note_Couverture_Automobile_Agricole.doc";
        break;
        case "Règle proportionnelle":
  fileName = "Regle_Proportionnelle.dotx";
  filePath = "/documents/Regle_Proportionnelle.dotx";
  break;
      default:
        alert("Fichier non trouvé pour ce canevas.");
        return;
    }

    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCanevasClick = async (category, subCategory, title, item) => {
    // ==================== TÉLÉCHARGEMENT DIRECT - BOÎTE À OUTILS AGRICOLE ====================
    if (category === "AGRICOLE" && subCategory === "Boîte à outils") {
      handleDownloadAgriculturalTool(title);
      if (item?.id) {
        try {
          await supabase.rpc("increment_canevas_usage", { p_id: item.id });
        } catch (e) {
          console.warn("Erreur increment usage_count:", e);
        }
      }
      return;
    }




    // ==================== Questionnaire Agricole ====================
    if (category === "AGRICOLE" &&
        subCategory === "Questions légales" &&
        title === "Questionnaire") {
      setShowLegalModal(true);
      return;
    }

    // ==================== Procuration Verbale ====================
    if (isProcurationVerbaleCanevas(category, subCategory, title)) {
      setIsProcurationModalOpen(true);
      if (item?.id) {
        try {
          await supabase.rpc("increment_canevas_usage", { p_id: item.id });
        } catch (e) {
          console.warn("Erreur increment usage_count:", e);
        }
      }
      return;
    }

    // ==================== Refus d'augmenter le CVA ====================
    if (isRefusCVACanevas(category, subCategory, title)) {
      setIsRefusCVAModalOpen(true);
      if (item?.id) {
        try {
          await supabase.rpc("increment_canevas_usage", { p_id: item.id });
        } catch (e) {
          console.warn("Erreur increment usage_count:", e);
        }
      }
      return;
    }

// ==================== Paiement effectué avec assuré ====================
if (isPaiementEffectueCanevas(category, subCategory, title)) {
  setIsPaiementModalOpen(true);

  if (item?.id) {
    try {
      await supabase.rpc("increment_canevas_usage", { p_id: item.id });
    } catch (e) {
      console.warn("Erreur increment usage_count:", e);
    }
  }

  return;
}


if (isPrequalificationCanevas(category, subCategory, title)) {
  setIsPrequalificationModalOpen(true);

  if (item?.id) {
    try {
      await supabase.rpc("increment_canevas_usage", {
        p_id: item.id,
      });
    } catch (e) {
      console.warn("Erreur increment usage_count:", e);
    }
  }

  return;
}

    // Comportement normal pour tous les autres canevas
    const content = item?.content || "";
    const id = item?.id ?? null;

    navigator.clipboard.writeText(content);

    // Incrément du compteur d'utilisation
    if (id) {
      try {
        const { error } = await supabase.rpc("increment_canevas_usage", { p_id: id });
        if (error) console.warn("RPC increment_canevas_usage error:", error);
      } catch (e) {
        console.warn("Erreur increment usage_count:", e);
      }
    }

    // Comportement spécial pour les canevas ANNU (modal script)
    if (isCancellationCanevas(category, subCategory, title)) {
      setCopiedMessage("Canevas copié !");
      setTimeout(() => setCopiedMessage(""), 2000);
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

  // ✅ Génère le script de procuration en temps réel
  const generateProcurationScript = () => {
    const date = procurationDate
      ? new Date(procurationDate).toLocaleDateString('fr-CA')
      : new Date().toLocaleDateString('fr-CA');

    return `Je ${assureName} autorise ${authorizedPerson} à transiger dans mon dossier. Obtenir des informations, faire des modifications et effectuer des transactions concernant mon dossier automobile et habitation. Cette autorisation est valide jusqu'à avis contraire et débute le ${date}.`;
  };

  
  // ✅ Génère le texte pour "Refus d'augmenter le CVA"
  const generateRefusCVAScript = () => {
    const name = refusCVAName.trim() ? refusCVAName.trim() : "NOM DE L'ASSURÉ";
    return `Je ${name}, reconnais que mon courtier n'a pas la responsabilité ni la formation nécessaire pour déterminer les valeurs assurables de mes biens et qu'il m'a conseillé de consulter un professionnel de l'évaluation de façon à déterminer avec précision les montants d'assurance adéquats. En cas de sinistre, je reconnais que le courtier ne peut donc pas être tenu responsable des conséquences de tout écart entre les montants d'assurance de ma police actuelle et la valeur réelle de mes biens, selon un professionnel de l'évaluation ou tout autre expert.`;
  };

// ✅ Génère le texte pour "Paiement effectué avec assuré"
const generatePaiementEffectueScript = () => {
  return `À facturer svp

Prime : ${prime}

% de commission : ${commission}

Frais de police : ${fraisPolice}

Honoraire du courtier : ${honoraires}

Type de facturation : ${typeFacturation}

Police en participation : ${participation}

Type d’envoi : ${typeEnvoi}

Mention spéciale sur la lettre au client : ${mentionSpeciale}`;
};

  const pageTitle =
    sector === "entreprise"
      ? "Répertoire de canevas — Entreprise"
      : "Répertoire de canevas — Particulier";

  const pageSubtitle =
    sector === "entreprise"
      ? "Accède rapidement aux canevas et scripts pour les dossiers commerciaux."
      : "Accède rapidement aux canevas et scripts pour les dossiers des particuliers.";

  const categoryCount = Object.keys(canevasData || {}).length;
  const subCategoryCount = selectedCategory
    ? Object.keys(canevasData[selectedCategory] || {}).length
    : 0;
  const canevasCount =
    selectedCategory && selectedSubCategory
      ? Object.keys(canevasData[selectedCategory]?.[selectedSubCategory] || {}).length
      : 0;

const generatePrequalificationScript = () => {
  return `Questions légales - Préqualification

Autorisation crédit et FCSA :
${autorisationCredit}

Antécédents judiciaires :
${antecedentsJudiciaires}
${antecedentsJudiciaires === "Oui" ? `Détails : ${detailsAntecedents}` : ""}

Faillite ou proposition au consommateur :
${faillite}
${faillite === "Oui" ? `Détails : ${detailsFaillite}` : ""}

Refus ou annulation par un assureur :
${refusAssureur}
${refusAssureur === "Oui" ? `Détails : ${detailsRefusAssureur}` : ""}

Fraude ou fausse déclaration à l'assurance :
${fraudeAssurance}
${fraudeAssurance === "Oui" ? `Détails : ${detailsFraude}` : ""}

Réclamations dans les 6 dernières années :
${reclamations}

${reclamations === "Oui" ? `Réclamations fermées :
${reclamationsFermees}` : ""}

${reclamations === "Oui" ? `Détails des réclamations :
${detailsReclamations}` : ""}

Notes :
${notes}
`;
};

const resetPrequalificationForm = () => {
  setAutorisationCredit("");
  setAntecedentsJudiciaires("");
  setFaillite("");
  setRefusAssureur("");
  setFraudeAssurance("");
  setReclamations("");
  setReclamationsFermees("");
  setDetailsReclamations("");
  
  setDetailsAntecedents("");
setDetailsFaillite("");
setDetailsRefusAssureur("");
setDetailsFraude("");
setNotes("");
};

  // ✅ Canevas triés: usage_count desc + title asc
  const sortedCanevasEntries = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory) return [];

    const entries = Object.entries(
      canevasData?.[selectedCategory]?.[selectedSubCategory] || {}
    ).filter(([title]) => title && title.trim() !== "");

    return entries.sort((a, b) => {
      const ua = a?.[1]?.usage_count ?? 0;
      const ub = b?.[1]?.usage_count ?? 0;
      if (ub !== ua) return ub - ua;
      return String(a[0]).localeCompare(String(b[0]), "fr", { sensitivity: "base" });
    });
  }, [canevasData, selectedCategory, selectedSubCategory]);

  const shouldStagger = !prefersReducedMotion && sortedCanevasEntries.length <= 22;

  // =========================
  // ✅ Recherche: index flat + résultats
  // =========================
  const normalizedQuery = useMemo(() => (searchQuery || "").trim().toLowerCase(), [searchQuery]);

  const flatIndex = useMemo(() => {
    const out = [];
    for (const category of Object.keys(canevasData || {})) {
      const subObj = canevasData[category] || {};
      for (const subCategory of Object.keys(subObj)) {
        const titlesObj = subObj[subCategory] || {};
        for (const title of Object.keys(titlesObj)) {
          const item = titlesObj[title];
          if (!title?.trim()) continue;
          out.push({
            title,
            category,
            subCategory,
            item,
            usage_count: item?.usage_count ?? 0,
          });
        }
      }
    }
    return out;
  }, [canevasData]);

  const searchActive = searchOpen && normalizedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!searchActive) return [];

    const q = normalizedQuery;
    const filtered = flatIndex.filter((r) => String(r.title || "").toLowerCase().includes(q));

    filtered.sort((a, b) => {
      if ((b.usage_count ?? 0) !== (a.usage_count ?? 0)) {
        return (b.usage_count ?? 0) - (a.usage_count ?? 0);
      }
      return String(a.title).localeCompare(String(b.title), "fr", { sensitivity: "base" });
    });

    return filtered.slice(0, 12);
  }, [searchActive, normalizedQuery, flatIndex]);

  // =========================
  // Motion variants
  // =========================
  const swapContainer = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
    show: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.12, ease: "easeOut" } },
    exit: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 0, y: -6, transition: { duration: 0.10, ease: "easeIn" } },
  };

  const listVariants = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
    show: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          transition: shouldStagger
            ? { staggerChildren: 0.02, delayChildren: 0.02 }
            : { duration: 0.16 },
        },
    exit: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, transition: { duration: 0.12 } },
  };

  const itemVariants = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 },
    show: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: 0.11, ease: "easeOut" } },
    exit: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 0, y: -4, transition: { duration: 0.09, ease: "easeIn" } },
  };

  const searchWrapVariants = {
    closed: prefersReducedMotion ? { width: 0, opacity: 1 } : { width: 0, opacity: 0 },
    open: prefersReducedMotion
      ? { width: "260px", opacity: 1 }
      : { width: "260px", opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  };

  const SearchIcon = ({ className = "" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // ✅ Fermer recherche (ESC)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (searchOpen) {
          setSearchQuery("");
          setSearchOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  // =========================
  // ✅ Modal Questionnaire Légales - Agricole
  // =========================
  const handleLegalResponse = (reponse) => {
    if (reponse === "oui") {
      alert("✅ Autorisations acceptées");
    } else {
      alert("❌ Autorisations refusées");
    }
    setShowLegalModal(false);
  };

  const LegalQuestionnaireModal = () => (
    <AnimatePresence>
      {showLegalModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="px-6 py-5 border-b bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">
                Questionnaire légale - Agricole
              </h2>
            </div>

            <div className="p-6 space-y-6 text-gray-800 leading-relaxed">
              <div>
                1. Afin de permettre à l’assureur d’accorder sa meilleure offre,
                l’autorisez-vous à obtenir vos informations de crédit auprès des agences
                d’évaluation du crédit ? Votre assureur pourra consulter ces agences pour
                faire des mises à jour lors de vos renouvellements ou modifications.
              </div>

              <div>
                2. Donnez-vous l’autorisation aux assureurs de consulter votre dossier
                de sinistres au fichier centrale des sinistres automobile ainsi que
                tous les conducteurs mentionnés au contrat ?
              </div>
            </div>

            <div className="border-t flex divide-x">
              <button
                onClick={() => handleLegalResponse("non")}
                className="flex-1 py-4 text-red-600 font-medium hover:bg-gray-100 transition"
              >
                Non
              </button>
              <button
                onClick={() => handleLegalResponse("oui")}
                className="flex-1 py-4 text-emerald-600 font-semibold hover:bg-gray-100 transition"
              >
                Oui
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
      className="p-6 bg-white"
    >
      {/* Header + recherche */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">{pageTitle}</h1>
            <p className="text-white/80 text-sm mt-1">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {categoryCount} catégories
            </span>

            {selectedCategory && !searchActive && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                {subCategoryCount} sous-catégories
              </span>
            )}

            {selectedCategory && selectedSubCategory && !searchActive && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                {canevasCount} canevas
              </span>
            )}

            <div
              className="flex items-center gap-2"
              onMouseEnter={() => setSearchOpen(true)}
              onMouseLeave={() => {
                if (!searchQuery.trim()) setSearchOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus?.(), 0);
                }}
                title="Rechercher un canevas"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/15 hover:bg-white/20 transition"
              >
                <SearchIcon className="w-5 h-5 text-white" />
              </button>

              <motion.div
                variants={searchWrapVariants}
                initial="closed"
                animate={searchOpen ? "open" : "closed"}
                className="overflow-hidden"
              >
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un canevas"
                  className="w-[260px] bg-white/15 placeholder-white/60 text-white border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  onFocus={() => setSearchOpen(true)}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {searchActive && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.14 }}
              className="mt-3 text-xs text-white/75"
            >
              Résultats pour <b className="text-white">{searchQuery.trim()}</b> — (ESC pour fermer)
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast copie */}
      <AnimatePresence>
        {copiedMessage && (
          <motion.div
            key="copiedToast"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            {copiedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode recherche et affichage normal */}
      <AnimatePresence mode="wait">
        {searchActive ? (
          <motion.div
            key="searchResults"
            variants={swapContainer}
            initial="hidden"
            animate="show"
            exit="exit"
            className="mt-2"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Résultats</h2>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition font-semibold"
              >
                Effacer
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 border rounded-xl bg-gray-50 text-gray-700">
                Aucun canevas trouvé pour “<b>{searchQuery.trim()}</b>”.
              </div>
            ) : (
              <motion.ul
                variants={{
                  hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0 },
                  show: prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.02 } },
                }}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {searchResults.map((r) => (
                  <motion.li key={`${r.category}-${r.subCategory}-${r.title}`} variants={itemVariants}>
                    <button
                      className="w-full text-left p-3 border rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white transition hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.99]"
                      onClick={() => handleCanevasClick(r.category, r.subCategory, r.title, r.item)}
                      title={`${r.category} → ${r.subCategory}`}
                    >
                      <div className="text-base sm:text-lg font-semibold">{r.title}</div>
                      <div className="text-xs sm:text-sm opacity-80 mt-1">
                        {r.category} → {r.subCategory}
                      </div>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="normalRepo"
            variants={swapContainer}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Catégories</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.keys(canevasData).map((category) => (
                  <button
                    key={category}
                    className={[
                      "px-3 py-2 border rounded-lg",
                      "transition-all duration-200",
                      "hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.99]",
                      selectedCategory === category
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-gray-50 hover:bg-gray-100",
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

            <AnimatePresence mode="wait">
              {selectedCategory && (
                <motion.div
                  key={`subcats-${selectedCategory}`}
                  variants={swapContainer}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="mt-5"
                >
                  <h2 className="text-xl font-semibold">Sous-catégories</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.keys(canevasData[selectedCategory] || {}).map((subCategory) => (
                      <button
                        key={subCategory}
                        className={[
                          "px-3 py-2 border rounded-lg",
                          "transition-all duration-200",
                          "hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.99]",
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
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {selectedSubCategory && (
                <motion.div
                  key={`canevas-${selectedCategory}-${selectedSubCategory}`}
                  variants={swapContainer}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="mt-6"
                >
                  <h2 className="text-xl font-semibold mb-2">Canevas</h2>

                  <motion.ul
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="space-y-2"
                  >
                    {sortedCanevasEntries.map(([canevas, item]) => {
                      const isTableauComparatif =
                        selectedCategory === "BATEAUX" &&
                        selectedSubCategory === "Tous" &&
                        canevas.trim().toLowerCase() === "tableau comparatif";

                      return (
                        <motion.li
                          key={canevas}
                          variants={itemVariants}
                          layout={!prefersReducedMotion}
                          layoutId={`${selectedCategory}-${selectedSubCategory}-${canevas}`}
                        >
                          {isTableauComparatif ? (
                            <a
                              href="https://lemieuxassurance-my.sharepoint.com/:x:/g/personal/pablo_beaulieu_lemieuxassurances_com/EdwMKQ9SzOtLv69Ny-a8jNYBpP9TPgCYxqom8spHJRlAIA?e=HMIfTI&xsdata=MDV8MDJ8cGFibG8uYmVhdWxpZXVAbGVtaWV1eGFzc3VyYW5jZXMuY29tfDQ3YjkwNThjMDM4ZDQ2OGMwMjg1MDhkZTlmYjQ1NjFlfDUwNDBiNjgxOWNjZDQ5NTE5YTZjOWQ0MzUxZDA2MTkwfDB8MHw2MzkxMjM3OTQwODg4Njg5NDZ8VW5rbm93bnxUV0ZwYkdac2IzZDhleUpGYlhCMGVVMWhjR2tpT25SeWRXVXNJbFlpT2lJd0xqQXVNREF3TUNJc0lsQWlPaUpYYVc0ek1pSXNJa0ZPSWpvaVRXRnBiQ0lzSWxkVUlqb3lmUT09fDB8fHw%3d&sdata=TEtFY2h3MDFjTkk4dkJIdjlUcmg0dGlsdVNlRkdJeEN0RU4vdTZJQXgrMD0%3d"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full text-left text-base sm:text-lg font-semibold p-3 border rounded-xl bg-blue-50 hover:bg-blue-100 hover:text-blue-900 transition hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.99]"
                            >
                              {canevas} 🔗
                            </a>
                          ) : (
                            <button
                              className="w-full text-left text-base sm:text-lg font-semibold p-3 border rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white transition hover:shadow-sm hover:-translate-y-[1px] active:scale-[0.99]"
                              onClick={() =>
                                handleCanevasClick(selectedCategory, selectedSubCategory, canevas, item)
                              }
                            >
                              {canevas}
                            </button>
                          )}
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal script annulation */}
      <AnimatePresence>
        {isScriptModalOpen && selectedCanevas && (
          <motion.div
            key="scriptModal"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
              className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl flex gap-6"
            >
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
                <textarea
                  className="w-full p-2 border rounded mb-2"
                  rows="25"
                  readOnly
                  value={generateEmail()}
                />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Procuration Verbale */}
      <AnimatePresence>
        {isProcurationModalOpen && (
          <motion.div
            key="procurationModal"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-900">Procuration verbale</h2>
                <p className="text-sm text-gray-500 mt-1">Remplissez les informations ci-dessous</p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l’assuré</label>
                  <input
                    type="text"
                    placeholder="Nom complet de l'assuré"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assureName}
                    onChange={(e) => setAssureName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la personne autorisée</label>
                  <input
                    type="text"
                    placeholder="Nom de la personne autorisée"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={authorizedPerson}
                    onChange={(e) => setAuthorizedPerson(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date du jour</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={procurationDate}
                    onChange={(e) => setProcurationDate(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Script verbal </label>
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-2xl font-medium text-gray-800 leading-relaxed resize-y min-h-[140px]"
                    readOnly
                    value={generateProcurationScript()}
                  />
                </div>
              </div>

              <div className="border-t px-6 py-4 flex gap-3 bg-gray-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateProcurationScript());
                    setCopiedMessage("Procuration copiée !");
                    setTimeout(() => setCopiedMessage(""), 2000);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition"
                >
                  Copier le texte
                </button>

                <button
                  onClick={() => {
                    setIsProcurationModalOpen(false);
                    setAssureName("");
                    setAuthorizedPerson("");
                    setProcurationDate("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-xl transition"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================== MODAL REFUS D'AUGMENTER LE CVA ====================== */}
      <AnimatePresence>
        {isRefusCVAModalOpen && (
          <motion.div
            key="refusCVAModal"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b bg-gray-50">
                <h2 className="text-2xl font-semibold text-gray-900">Refus d'augmenter le CVA</h2>
                <p className="text-sm text-gray-500 mt-1">Remplissez le nom de l’assuré</p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l’assuré</label>
                  <input
                    type="text"
                    placeholder="Nom complet de l'assuré"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={refusCVAName}
                    onChange={(e) => setRefusCVAName(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texte à copier</label>
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-2xl font-medium text-gray-800 leading-relaxed resize-y min-h-[180px]"
                    readOnly
                    value={generateRefusCVAScript()}
                  />
                </div>
              </div>

              <div className="border-t px-6 py-4 flex gap-3 bg-gray-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateRefusCVAScript());
                    setCopiedMessage("Texte copié !");
                    setTimeout(() => setCopiedMessage(""), 2000);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition"
                >
                  Copier le texte
                </button>

                <button
                  onClick={() => {
                    setIsRefusCVAModalOpen(false);
                    setRefusCVAName("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-xl transition"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

{/* ====================== MODAL PAIEMENT EFFECTUÉ AVEC ASSURÉ ====================== */} <AnimatePresence>
{isPaiementModalOpen && (
<motion.div
key="paiementModal"
initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
animate={{ opacity: 1 }}
exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
>
<motion.div
initial={
prefersReducedMotion
? { opacity: 1 }
: { opacity: 0, y: 10, scale: 0.98 }
}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={
prefersReducedMotion
? { opacity: 1 }
: { opacity: 0, y: 10, scale: 0.98 }
}
transition={{
duration: prefersReducedMotion ? 0 : 0.18,
ease: "easeOut",
}}
className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
> <div className="px-6 py-5 border-b bg-gray-50"> <h2 className="text-2xl font-semibold text-gray-900">
Paiement effectué avec assuré </h2> </div>


    <div className="p-6 space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prime (sans les taxes, frais etc.)
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={prime}
          onChange={(e) => setPrime(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          % de commission
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frais de police
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={fraisPolice}
          onChange={(e) => setFraisPolice(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Honoraire du courtier ***les honoraires doivent minimalement respecter la grille, sinon approbation de votre directeur est demandée***
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={honoraires}
          onChange={(e) => setHonoraires(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de facturation (agence/direct/Primaco)
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={typeFacturation}
          onChange={(e) => setTypeFacturation(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Police en participation : Oui/Non. Si oui, la prime et les frais à facturer doivent être détaillés par assureur.
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={participation}
          onChange={(e) => setParticipation(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type d’envoi : par courriel OU par poste (pas les 2, l’un ou l’autre)
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-xl"
          value={typeEnvoi}
          onChange={(e) => setTypeEnvoi(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mention spéciale sur la lettre au client (mention brève et précise svp)
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-xl"
          rows="3"
          value={mentionSpeciale}
          onChange={(e) => setMentionSpeciale(e.target.value)}
        />
      </div>

    </div>

    <div className="border-t px-6 py-4 flex gap-3 bg-gray-50">

      <button
        onClick={() => {
          navigator.clipboard.writeText(generatePaiementEffectueScript());

          setCopiedMessage("Texte copié !");
          setTimeout(() => setCopiedMessage(""), 2000);

          setIsPaiementModalOpen(false);

          setPrime("");
          setCommission("");
          setFraisPolice("");
          setHonoraires("");
          setTypeFacturation("");
          setParticipation("");
          setTypeEnvoi("");
          setMentionSpeciale("");
        }}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition"
      >
        Copier le texte
      </button>

      <button
        onClick={() => {
          setIsPaiementModalOpen(false);

          setPrime("");
          setCommission("");
          setFraisPolice("");
          setHonoraires("");
          setTypeFacturation("");
          setParticipation("");
          setTypeEnvoi("");
          setMentionSpeciale("");
        }}
        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-xl transition"
      >
        Fermer
      </button>

    </div>
  </motion.div>
</motion.div>


)} </AnimatePresence>

{/* ====================== MODAL QUESTIONS LÉGALES - PRÉQUALIFICATION ====================== */}
<AnimatePresence>
  {isPrequalificationModalOpen && (
    <motion.div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto">

<div className="px-6 py-5 border-b bg-gray-50">
  <h2 className="text-2xl font-semibold text-gray-900">
    Questions légales - Préqualification
  </h2>

  <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-lg">
    <p className="text-base font-semibold text-amber-900">
      ⚠️ Obligatoire à chaque début d’appel pour une nouvelle affaire
    </p>
  </div>
</div>

        <div className="p-4 space-y-4">

          <div>
<label className="block text-base font-medium mb-1">
  Pointage de crédit et FCSA : Afin de vous offrir la meilleure prime,
  j’aurais besoin de votre autorisation pour consulter votre dossier de
  crédit et votre dossier au FCSA. Le consentement demeure valide tant que
  vous faites affaire avec nous, est-ce que j’ai votre autorisation ?
</label>

<p className="text-xs text-gray-500 mb-2">
  (C’est seulement une lecture du dossier de crédit du client, aucun impact
  sur la cote)
</p>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              value={autorisationCredit}
              onChange={(e) => setAutorisationCredit(e.target.value)}
            />
          </div>

<div>
  <label className="block text-base font-medium mb-1">
    Est-ce que vous ou toute personne habitant sous votre toit avez des
    antécédents judiciaires, un dossier criminel ou êtes en attente d’un
    procès ?
  </label>

  <select
    className="w-full p-2 border rounded-lg"
    value={antecedentsJudiciaires}
    onChange={(e) => setAntecedentsJudiciaires(e.target.value)}
  >
    <option value="">Choisir</option>
    <option value="Non">Non</option>
    <option value="Oui">Oui</option>
  </select>

  {antecedentsJudiciaires === "Oui" && (
    <textarea
      rows="3"
      className="w-full p-2 border rounded-lg mt-2"
      placeholder="Précisions"
      value={detailsAntecedents}
      onChange={(e) => setDetailsAntecedents(e.target.value)}
    />
  )}
</div>

<div>
  <label className="block text-base font-medium mb-1">
    Est-ce que vous ou toute personne habitant sous votre toit avez-vous déjà
    déclaré faillite ou eu une proposition au consommateur ?
  </label>

  <p className="text-xs text-gray-500 mb-2">
    Si oui, date de libération (année et mois) et si moins de 3 ans = non standard
  </p>

  <select
    className="w-full p-2 border rounded-lg"
    value={faillite}
    onChange={(e) => setFaillite(e.target.value)}
  >
    <option value="">Choisir</option>
    <option value="Non">Non</option>
    <option value="Oui">Oui</option>
  </select>

  {faillite === "Oui" && (
    <textarea
      rows="3"
      className="w-full p-2 border rounded-lg mt-2"
      placeholder="Précisions"
      value={detailsFaillite}
      onChange={(e) => setDetailsFaillite(e.target.value)}
    />
  )}
</div>


<div>
  <label className="block text-base font-medium mb-1">
    Avez-vous déjà été refusé ou annulé par un assureur, notamment pour non-paiement de prime, aggravation ou fausse déclaration ?
  </label>

  <p className="text-xs text-gray-500 mb-2">
    Moins de 3 ans = non standard. Si annulé par un de nos assureurs : vérifier le solde antérieur.
  </p>

  <select
    className="w-full p-2 border rounded-lg"
    value={refusAssureur}
    onChange={(e) => setRefusAssureur(e.target.value)}
  >
    <option value="">Choisir</option>
    <option value="Non">Non</option>
    <option value="Oui">Oui</option>
  </select>

  {refusAssureur === "Oui" && (
    <textarea
      rows="3"
      className="w-full p-2 border rounded-lg mt-2"
      placeholder="Précisions"
      value={detailsRefusAssureur}
      onChange={(e) => setDetailsRefusAssureur(e.target.value)}
    />
  )}
</div>

<div>
  <label className="block text-base font-medium mb-1">
    Avez-vous déjà été reconnu coupable de fraude ou fausse déclaration à l’assurance ?
  </label>

  <select
    className="w-full p-2 border rounded-lg"
    value={fraudeAssurance}
    onChange={(e) => setFraudeAssurance(e.target.value)}
  >
    <option value="">Choisir</option>
    <option value="Non">Non</option>
    <option value="Oui">Oui</option>
  </select>

  {fraudeAssurance === "Oui" && (
    <textarea
      rows="3"
      className="w-full p-2 border rounded-lg mt-2"
      placeholder="Précisions"
      value={detailsFraude}
      onChange={(e) => setDetailsFraude(e.target.value)}
    />
  )}
</div>

<div>
  <label className="block text-base font-medium mb-1">
    Avez-vous effectué des réclamations dès les 6 dernières années auprès d’un assureur ou êtes-vous au courant d’un évènement pouvant donner lieu à une réclamation ?
  </label>

  <select
    className="w-full p-2 border rounded-lg"
    value={reclamations}
    onChange={(e) => setReclamations(e.target.value)}
  >
    <option value="">Choisir</option>
    <option value="Non">Non</option>
    <option value="Oui">Oui</option>
  </select>

  {reclamations === "Oui" && (
    <>
      <div className="mt-3">
        <label className="block text-base font-medium mb-1">
          Détails des réclamations
        </label>

        <textarea
          rows="4"
          className="w-full p-2 border rounded-lg"
          placeholder="Précisions"
          value={detailsReclamations}
          onChange={(e) => setDetailsReclamations(e.target.value)}
        />
      </div>
    </>
  )}
</div>

{reclamations === "Oui" && (
  <div>
    <label className="block text-base font-medium mb-1">
      Si oui, est-ce que les réclamations sont présentement fermées ?
    </label>

    <select
      className="w-full p-2 border rounded-lg"
      value={reclamationsFermees}
      onChange={(e) => setReclamationsFermees(e.target.value)}
    >
      <option value="">Choisir</option>
      <option value="Oui">Oui</option>
      <option value="Non">Non</option>
    </select>
  </div>
)}

<div>
  <label className="block text-base font-medium mb-1">
    Notes
  </label>

  <textarea
    rows="4"
    className="w-full p-2 border rounded-lg"
    placeholder="Ajouter des notes au besoin..."
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
  />
</div>

        </div>

        <div className="border-t px-6 py-4 flex gap-3 bg-gray-50">

          <button
            onClick={() => {
              navigator.clipboard.writeText(
                generatePrequalificationScript()
              );

              resetPrequalificationForm();
              setIsPrequalificationModalOpen(false);
            }}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl"
          >
            Copier le texte
          </button>

          <button
            onClick={() => {
              resetPrequalificationForm();
              setIsPrequalificationModalOpen(false);
            }}
            className="flex-1 bg-gray-200 py-3 rounded-xl"
          >
            Fermer
          </button>

        </div>

      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* Modal Questionnaire Légales */}
<LegalQuestionnaireModal />
</motion.div>
);
}

export default Canevas;