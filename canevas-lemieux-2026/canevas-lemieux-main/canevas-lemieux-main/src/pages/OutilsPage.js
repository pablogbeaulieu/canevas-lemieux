import { useEffect, useRef, useState } from "react";
import { supabase } from "../api";
import { AnimatePresence, motion } from "framer-motion";

export default function OutilsPage() {
  const [postalInput, setPostalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const lastQueryRef = useRef("");

  const normalizeFSA = (value) => {
    const v = (value || "").toUpperCase().trim().replace(/\s+/g, "");
    return v.slice(0, 3);
  };

  const buildMapsUrl = (origin, destination) => {
    const o = encodeURIComponent(origin || "");
    const d = encodeURIComponent(destination || "");
    return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}`;
  };

  const originForMaps = () => {
    const raw = (postalInput || "").trim().toUpperCase();
    // Si le user a tapé le code complet, on l'utilise (sinon FSA)
    return raw.replace(/\s+/g, "").length >= 6 ? raw : normalizeFSA(raw);
  };

  const searchFSA = async (forcedFsa) => {
    const fsa = forcedFsa || normalizeFSA(postalInput);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data, error } = await supabase
        .from("fsa_map")
        .select("fsa, succursale, postal_succursale")
        .eq("fsa", fsa)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError(`Aucun résultat pour ${fsa}. (À valider)`);
        return;
      }

      setResult(data);
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la recherche. Vérifie la table fsa_map + RLS.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-recherche dès qu'on a 3 chars valides (avec debounce)
  useEffect(() => {
    const fsa = normalizeFSA(postalInput);

    // Reset si vide
    if (!postalInput.trim()) {
      setError("");
      setResult(null);
      setLoading(false);
      lastQueryRef.current = "";
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Si pas assez long (moins de 3), on n'appelle pas
    if (fsa.length < 3) {
      setError("");
      setResult(null);
      setLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Validation simple : 3 chars alphanum
    if (!/^[A-Z0-9]{3}$/.test(fsa)) {
      setError("Entre un code postal valide (au moins 3 caractères). Ex: G1P");
      setResult(null);
      setLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Évite de relancer la même recherche en boucle
    if (lastQueryRef.current === fsa) return;

    // Debounce 350ms (évite de spam Supabase)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastQueryRef.current = fsa;
      searchFSA(fsa);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [postalInput]);

  const onManualSearch = () => {
    const fsa = normalizeFSA(postalInput);
    if (!/^[A-Z0-9]{3}$/.test(fsa)) {
      setError("Entre un code postal valide (au moins 3 caractères). Ex: G1P");
      return;
    }
    lastQueryRef.current = fsa;
    searchFSA(fsa);
  };

  const toolCount = 1; // pour l'instant
  const helpText =
    "Entre les 3 premiers caractères du code postal (ex: G1P). La recherche démarre automatiquement.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="p-6 bg-white"
    >
      {/* ✅ Header modernisé (même style que les autres pages) */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Outils</h1>
            <p className="text-white/80 text-sm mt-1">
              Outils internes pour accélérer le travail au quotidien.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {toolCount} outil disponible
            </span>
            {result?.succursale && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                Résultat prêt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Carte outil */}
      <div className="border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Trouver la succursale la plus proche</h2>
            <p className="text-sm text-gray-600 mt-1">{helpText}</p>
          </div>

          {/* petit chip "auto" */}
          <span className="hidden sm:inline-flex text-xs font-medium bg-white border px-3 py-1 rounded-full text-gray-700">
            À jour
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={postalInput}
            onChange={(e) => setPostalInput(e.target.value)}
            placeholder="Ex: G1P ou G1P 1K6"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          {/* bouton fallback */}
          <button
            onClick={onManualSearch}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-5 py-3 rounded-lg transition font-semibold"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </div>

        {/* ✅ Petit indicateur discret pendant la recherche */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mt-3 text-sm text-gray-600"
            >
              ⏳ Recherche en cours…
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Erreur avec apparition douce */}
        <AnimatePresence>
          {!!error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ Résultat avec slide+fade */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
              className="mt-4 p-4 bg-white border rounded-xl"
            >
              <div className="text-sm text-gray-500 mb-2">
                FSA: <b>{result.fsa}</b>
              </div>

              <div className="text-lg font-semibold">Succursale: {result.succursale}</div>

              {result.postal_succursale && (
                <div className="text-sm text-gray-700 mt-1">
                  Code postal succursale: <b>{result.postal_succursale}</b>
                </div>
              )}

              {result.postal_succursale && (
                <a
                  className="inline-flex items-center gap-2 mt-3 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                  href={buildMapsUrl(originForMaps(), result.postal_succursale)}
                  target="_blank"
                  rel="noreferrer"
                >
                  🗺️ Ouvrir l’itinéraire (Google Maps)
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
