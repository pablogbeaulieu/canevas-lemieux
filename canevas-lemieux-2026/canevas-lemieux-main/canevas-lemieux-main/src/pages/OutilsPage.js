import { useEffect, useRef, useState } from "react";
import { supabase } from "../api";
import { AnimatePresence, motion } from "framer-motion";

export default function OutilsPage() {
  // =========================
  // ✅ Tool 1 — FSA -> Succursale (Supabase)
  // =========================
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // =========================
  // ✅ Tool 2 — Décoder NIV (VIN) (API vPIC, aucun DB)
  // =========================
  const [vinInput, setVinInput] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinResult, setVinResult] = useState(null);
  const [vinError, setVinError] = useState("");
  const [vinShowDetails, setVinShowDetails] = useState(false);

  // Debounce + anti-replay pour auto-décodage VIN
  const vinDebounceRef = useRef(null);
  const lastVinDecodedRef = useRef("");

  const normalizeVin = (value) => (value || "").toUpperCase().trim();

  const isValidVin = (value) => {
    const vin = normalizeVin(value);
    if (vin.length !== 17) return false;
    if (!/^[A-Z0-9]{17}$/.test(vin)) return false;
    if (/[IOQ]/.test(vin)) return false; // standard VIN (évite confusion 1/0)
    return true;
  };

  const safe = (v) => (v == null ? "" : String(v)).trim();

  // ✅ Formatage friendly (portes + drive type)
  const formatDoorsDr = (doorsRaw) => {
    const d = safe(doorsRaw);
    const n = parseInt(d, 10);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${n}dr`;
  };

  const formatDriveTypeShort = (driveTypeRaw) => {
    const s = safe(driveTypeRaw).toUpperCase();
    if (!s) return "";

    // 4x2 = 2 roues motrices (2WD)
    if (s.includes("4X2")) return "2WD";

    // Ordre important
    if (s.includes("AWD") || s.includes("ALL WHEEL")) return "AWD";
    if (s.includes("RWD") || s.includes("REAR WHEEL")) return "RWD";
    if (s.includes("FWD") || s.includes("FRONT WHEEL")) return "FWD";

    if (
      s.includes("4WD") ||
      s.includes("4-WHEEL") ||
      s.includes("4X4") ||
      s.includes("FOUR WHEEL")
    ) {
      return "4WD";
    }

    // Fallback: si inconnu, on garde brut (rare)
    return safe(driveTypeRaw);
  };

  const decodeVin = async (forcedVin) => {
    const vin = normalizeVin(forcedVin ?? vinInput);

    setVinLoading(true);
    setVinError("");
    setVinResult(null);
    setVinShowDetails(false);

    if (!isValidVin(vin)) {
      setVinLoading(false);
      setVinError("NIV invalide (17 caractères, pas de I/O/Q).");
      return;
    }

    try {
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const json = await res.json();

      const first = json?.Results?.[0] || {};

      // Champs “core”
      const modelYear = safe(first.ModelYear);
      const make = safe(first.Make);
      const model = safe(first.Model);

      // Champs “version / finition” (pas toujours remplis)
      const trim = safe(first.Trim);
      const trim2 = safe(first.Trim2);
      const series = safe(first.Series);

      // Champs utiles (formatés)
      const doors = formatDoorsDr(first.Doors);
      const driveType = formatDriveTypeShort(first.DriveType);

      // Autres détails fréquents (selon le VIN)
      const bodyClass = safe(first.BodyClass);
      const vehicleType = safe(first.VehicleType);
      const engineCylinders = safe(first.EngineCylinders);
      const displacementL = safe(first.DisplacementL);
      const fuelTypePrimary = safe(first.FuelTypePrimary);
      const transmissionStyle = safe(first.TransmissionStyle);
      const transmissionSpeeds = safe(first.TransmissionSpeeds);
      const plantCountry = safe(first.PlantCountry);
      const plantCity = safe(first.PlantCity);
      const plantState = safe(first.PlantState);

      if (!modelYear && !make && !model) {
        setVinError("Aucune info trouvée pour ce NIV.");
        return;
      }

      setVinResult({
        modelYear,
        make,
        model,
        trim,
        trim2,
        series,
        doors,
        driveType,
        bodyClass,
        vehicleType,
        engineCylinders,
        displacementL,
        fuelTypePrimary,
        transmissionStyle,
        transmissionSpeeds,
        plantCountry,
        plantCity,
        plantState,
      });
    } catch (e) {
      console.error(e);
      setVinError("Erreur lors du décodage (API vPIC).");
    } finally {
      setVinLoading(false);
    }
  };

  const onVinKeyDown = (e) => {
    if (e.key === "Enter") decodeVin();
  };

  // ✅ Auto-décodage quand on a EXACTEMENT 17 chars valides (avec debounce)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const vin = normalizeVin(vinInput);

    // Si on retape / efface, on annule le debounce
    if (vinDebounceRef.current) clearTimeout(vinDebounceRef.current);

    // Pas 17 chars -> on ne fait rien
    if (vin.length !== 17) return;

    // 17 chars mais invalide (I/O/Q etc) -> on ne spam pas
    if (!isValidVin(vin)) return;

    // Évite de redécoder le même VIN
    if (lastVinDecodedRef.current === vin) return;

    // Debounce (coller/taper)
    vinDebounceRef.current = setTimeout(() => {
      lastVinDecodedRef.current = vin;
      decodeVin(vin);
    }, 350);

    return () => {
      if (vinDebounceRef.current) clearTimeout(vinDebounceRef.current);
    };
  }, [vinInput]);

  const buildVinSummary = (r) => {
    if (!r) return "";
    const trimLike = r.trim || r.series || r.trim2;
    const doorsLike = r.doors || "";
    const driveLike = r.driveType || "";

    return [r.modelYear, r.make, r.model, trimLike, doorsLike, driveLike]
      .filter(Boolean)
      .join(" • ");
  };

  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="rounded-lg border bg-white px-3 py-2">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    );
  };

  // =========================
  // UI Meta
  // =========================
  const toolCount = 2;
  const helpText =
    "Entre les 3 premiers caractères du code postal (ex: G1P). La recherche démarre automatiquement.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="p-6 bg-white"
    >
      {/* ✅ Header modernisé */}
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
              {toolCount} outils disponibles
            </span>
            {result?.succursale && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                Succursale trouvée
              </span>
            )}
            {vinResult?.make && (
              <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
                VIN décodé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* ✅ Carte outil 1 — Succursale */}
      {/* ========================= */}
      <div className="border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Trouver la succursale la plus proche
            </h2>
            <p className="text-sm text-gray-600 mt-1">{helpText}</p>
          </div>

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

          <button
            onClick={onManualSearch}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-5 py-3 rounded-lg transition font-semibold"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </div>

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

              <div className="text-lg font-semibold">
                Succursale: {result.succursale}
              </div>

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

      {/* ========================= */}
      {/* ✅ Carte outil 2 — Décodage NIV (VIN) */}
      {/* ========================= */}
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* ✅ Titre + petit "?" aide */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Décoder un NIV (VIN)</h2>

              <span className="relative inline-flex group">
                <span className="cursor-help select-none inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold text-gray-700 bg-white">
                  ?
                </span>

                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="block rounded-lg border bg-white shadow-sm px-3 py-2 text-xs text-gray-700">
                    <b>Source :</b> vPIC (NHTSA – U.S. DOT). Données fournies par
                    les constructeurs; certains champs peuvent être absents selon le VIN.
                  </span>
                </span>
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-1">
              Entre un NIV (17 caractères). Décodage automatique quand le VIN est complet.
            </p>
          </div>

          <span className="hidden sm:inline-flex text-xs font-medium bg-white border px-3 py-1 rounded-full text-gray-700">
            Auto (API)
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={vinInput}
            onChange={(e) => {
              const next = e.target.value;
              setVinInput(next);

              // ✅ Dès que le VIN change, on efface l’ancien résultat + détails
              if (vinResult) setVinResult(null);
              if (vinShowDetails) setVinShowDetails(false);

              // ✅ On efface l’erreur quand l’utilisateur retape
              if (vinError) setVinError("");
            }}
            onKeyDown={onVinKeyDown}
            placeholder="Ex: 1HGCM82633A004352"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <button
            onClick={() => decodeVin()}
            disabled={vinLoading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-5 py-3 rounded-lg transition font-semibold"
          >
            {vinLoading ? "Décodage..." : "Décoder"}
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Astuce: un VIN valide fait exactement <b>17</b> caractères (sans I, O, Q).
        </div>

        <AnimatePresence>
          {vinLoading && (
            <motion.div
              key="vinLoading"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mt-3 text-sm text-gray-600"
            >
              ⏳ Décodage en cours…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!!vinError && !vinLoading && (
            <motion.div
              key="vinError"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-4 text-red-600 text-sm"
            >
              {vinError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {vinResult && !vinLoading && (
            <motion.div
              key="vinResult"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
              className="mt-4 p-4 bg-white border rounded-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    NIV: <b>{normalizeVin(vinInput)}</b>
                  </div>

                  <div className="text-lg font-semibold">
                    {buildVinSummary(vinResult) || "Résumé indisponible"}
                  </div>

                  {!vinResult.trim && !vinResult.series && !vinResult.trim2 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Note: la “version/trim” n’est pas toujours fournie par le décodage VIN.
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setVinShowDetails((v) => !v)}
                    className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition font-semibold"
                  >
                    {vinShowDetails ? "Masquer les détails" : "Voir les détails"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {vinShowDetails && (
                  <motion.div
                    key="vinDetails"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="mt-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <DetailRow label="Année" value={vinResult.modelYear} />
                      <DetailRow label="Marque" value={vinResult.make} />
                      <DetailRow label="Modèle" value={vinResult.model} />

                      <DetailRow label="Trim / Version" value={vinResult.trim} />
                      <DetailRow label="Série" value={vinResult.series} />
                      <DetailRow label="Trim2" value={vinResult.trim2} />

                      <DetailRow label="Type de véhicule" value={vinResult.vehicleType} />
                      <DetailRow label="Classe de carrosserie" value={vinResult.bodyClass} />
                      <DetailRow label="Portes" value={vinResult.doors} />

                      <DetailRow
                        label="DriveType (AWD/FWD/RWD/4WD/2WD)"
                        value={vinResult.driveType}
                      />
                      <DetailRow
                        label="Carburant (principal)"
                        value={vinResult.fuelTypePrimary}
                      />
                      <DetailRow
                        label="Moteur"
                        value={[
                          vinResult.engineCylinders ? `${vinResult.engineCylinders} cyl` : "",
                          vinResult.displacementL ? `${vinResult.displacementL} L` : "",
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      />

                      <DetailRow
                        label="Transmission (style)"
                        value={vinResult.transmissionStyle}
                      />
                      <DetailRow
                        label="Transmission (vitesses)"
                        value={vinResult.transmissionSpeeds}
                      />

                      <DetailRow label="Usine (pays)" value={vinResult.plantCountry} />
                      <DetailRow label="Usine (ville)" value={vinResult.plantCity} />
                      <DetailRow label="Usine (état/province)" value={vinResult.plantState} />
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Certains champs peuvent être vides, tout dépend des informations disponibles pour ce VIN.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
