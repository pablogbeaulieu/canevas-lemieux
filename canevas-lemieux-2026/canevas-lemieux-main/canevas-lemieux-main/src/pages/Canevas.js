import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../api";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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

  const handleCanevasClick = async (category, subCategory, title, item) => {
    const content = item?.content || "";
    const id = item?.id ?? null;

    navigator.clipboard.writeText(content);

    // ✅ Incrément DB (sans update local instantané)
    if (id) {
      try {
        const { error } = await supabase.rpc("increment_canevas_usage", { p_id: id });
        if (error) console.warn("RPC increment_canevas_usage error:", error);
      } catch (e) {
        console.warn("Erreur increment usage_count:", e);
      }
    }

    // ✅ NOUVEAU: toast aussi pour ANNU (pour que ce soit clair que c’est copié)
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
      className="p-6 bg-white"
    >
      {/* ✅ Header modernisé + recherche intégrée */}
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

            {/* ✅ Zone loupe + input (hover ONLY ici) */}
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

      {/* ✅ Toast copie */}
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

      {/* ========================= */}
      {/* ✅ MODE RECHERCHE */}
      {/* ========================= */}
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
            {/* Catégories */}
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

            {/* Sous-catégories */}
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

            {/* Canevas */}
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
                              href="https://lemieuxassurance-my.sharepoint.com/:x:/g/personal/pablo_beaulieu_lemieuxassurances_com/EdwMKQ9SzOtLv69Ny-a8jNYBpP9TPgCYxqom8spHJRlAIA?e=HMIfTI"
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
    </motion.div>
  );
}

export default Canevas;
