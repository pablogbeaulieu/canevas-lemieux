import { useCallback, useEffect, useRef, useState } from "react";
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

  const normalizeFSA = useCallback((value) => {
    const v = (value || "").toUpperCase().trim().replace(/\s+/g, "");
    return v.slice(0, 3);
  }, []);

  const buildMapsUrl = useCallback((origin, destination) => {
    return `https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.google.com%2Fmaps%2Fdir%2F%3Fapi%3D1%26origin%3D%24&data=05%7C02%7Cpablo.beaulieu%40lemieuxassurances.com%7Ca582c2c50a244aeed14308de9fb791e2%7C5040b6819ccd49519a6c9d4351d06190%7C0%7C0%7C639123808398190346%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=lbcNpZ5%2FG6tNJAcq8zHFXR64joXiCcnKOQPAC6Ib2mM%3D&reserved=0{encodeURIComponent(
      origin || ""
    )}&destination=${encodeURIComponent(destination || "")}`;
  }, []);

  const originForMaps = useCallback(() => {
    const raw = (postalInput || "").trim().toUpperCase();
    return raw.replace(/\s+/g, "").length >= 6 ? raw : normalizeFSA(raw);
  }, [postalInput, normalizeFSA]);

  const searchFSA = useCallback(
    async (forcedFsa) => {
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
    },
    [postalInput, normalizeFSA]
  );

  // ✅ Auto-recherche avec debounce
  useEffect(() => {
    const fsa = normalizeFSA(postalInput);

    if (!postalInput.trim()) {
      setError("");
      setResult(null);
      setLoading(false);
      lastQueryRef.current = "";
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (fsa.length < 3) {
      setError("");
      setResult(null);
      setLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (!/^[A-Z0-9]{3}$/.test(fsa)) {
      setError("Entre un code postal valide (au moins 3 caractères). Ex: G1P");
      setResult(null);
      setLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (lastQueryRef.current === fsa) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastQueryRef.current = fsa;
      searchFSA(fsa);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [postalInput, normalizeFSA, searchFSA]);

  const onManualSearch = useCallback(() => {
    const fsa = normalizeFSA(postalInput);
    if (!/^[A-Z0-9]{3}$/.test(fsa)) {
      setError("Entre un code postal valide (au moins 3 caractères). Ex: G1P");
      return;
    }
    lastQueryRef.current = fsa;
    searchFSA(fsa);
  }, [postalInput, normalizeFSA, searchFSA]);

  // =========================
  // ✅ Tool 2 — Décoder NIV (VIN)
  // =========================
  const [vinInput, setVinInput] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinResult, setVinResult] = useState(null);
  const [vinError, setVinError] = useState("");
  const [vinShowDetails, setVinShowDetails] = useState(false);

  const vinDebounceRef = useRef(null);
  const lastVinDecodedRef = useRef("");

  const normalizeVin = useCallback((value) => (value || "").toUpperCase().trim(), []);

  const safe = useCallback((v) => (v == null ? "" : String(v)).trim(), []);

  const isValidVin = useCallback(
    (value) => {
      const vin = normalizeVin(value);
      if (vin.length !== 17) return false;
      if (!/^[A-Z0-9]{17}$/.test(vin)) return false;
      if (/[IOQ]/.test(vin)) return false;
      return true;
    },
    [normalizeVin]
  );

  const formatDoorsDr = useCallback(
    (doorsRaw) => {
      const d = safe(doorsRaw);
      const n = parseInt(d, 10);
      if (!Number.isFinite(n) || n <= 0) return "";
      return `${n}dr`;
    },
    [safe]
  );

  const formatDriveTypeShort = useCallback(
    (driveTypeRaw) => {
      const s = safe(driveTypeRaw).toUpperCase();
      if (!s) return "";
      if (s.includes("4X2")) return "2WD";
      if (s.includes("AWD") || s.includes("ALL WHEEL")) return "AWD";
      if (s.includes("RWD") || s.includes("REAR WHEEL")) return "RWD";
      if (s.includes("FWD") || s.includes("FRONT WHEEL")) return "FWD";
      if (s.includes("4WD") || s.includes("4-WHEEL") || s.includes("4X4")) return "4WD";
      return safe(driveTypeRaw);
    },
    [safe]
  );

  const decodeVin = useCallback(
    async (forcedVin) => {
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
        const url = `https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fvpic.nhtsa.dot.gov%2Fapi%2Fvehicles%2FDecodeVinValues%2F%24&data=05%7C02%7Cpablo.beaulieu%40lemieuxassurances.com%7Ca582c2c50a244aeed14308de9fb791e2%7C5040b6819ccd49519a6c9d4351d06190%7C0%7C0%7C639123808398256410%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=ccrUqwDtyP65MO5R4BKkdTviDuhrHnKLpUEe0NZJcNI%3D&reserved=0{vin}?format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();

        const first = json?.Results?.[0] || {};

        const modelYear = safe(first.ModelYear);
        const make = safe(first.Make);
        const model = safe(first.Model);
        const trim = safe(first.Trim);
        const trim2 = safe(first.Trim2);
        const series = safe(first.Series);
        const doors = formatDoorsDr(first.Doors);
        const driveType = formatDriveTypeShort(first.DriveType);
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
    },
    [vinInput, normalizeVin, isValidVin, safe, formatDoorsDr, formatDriveTypeShort]
  );

  const onVinKeyDown = useCallback((e) => {
    if (e.key === "Enter") decodeVin();
  }, [decodeVin]);

  useEffect(() => {
    const vin = normalizeVin(vinInput);
    if (vinDebounceRef.current) clearTimeout(vinDebounceRef.current);
    if (vin.length !== 17) return;
    if (!isValidVin(vin)) return;
    if (lastVinDecodedRef.current === vin) return;

    vinDebounceRef.current = setTimeout(() => {
      lastVinDecodedRef.current = vin;
      decodeVin(vin);
    }, 350);

    return () => {
      if (vinDebounceRef.current) clearTimeout(vinDebounceRef.current);
    };
  }, [vinInput, normalizeVin, isValidVin, decodeVin]);

  const buildVinSummary = useCallback((r) => {
    if (!r) return "";
    const trimLike = r.trim || r.series || r.trim2;
    const doorsLike = r.doors || "";
    const driveLike = r.driveType || "";
    return [r.modelYear, r.make, r.model, trimLike, doorsLike, driveLike]
      .filter(Boolean)
      .join(" • ");
  }, []);

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
  // ✅ Tool 3 — Liste des codes d'agence (lien SharePoint)
  // =========================
  const _openAgencyCodes = () => {
    window.open(
      "https://lemieuxassurance.sharepoint.com/:x:/s/AssurancedesParticuliers/IQD8BnLgpBioQolYeKsS37jRATym_KyNd4IF_sXm3KOrIDs?e=7g9A2w&xsdata=MDV8MDJ8cGFibG8uYmVhdWxpZXVAbGVtaWV1eGFzc3VyYW5jZXMuY29tfGE1ODJjMmM1MGEyNDRhZWVkMTQzMDhkZTlmYjc5MWUyfDUwNDBiNjgxOWNjZDQ5NTE5YTZjOWQ0MzUxZDA2MTkwfDB8MHw2MzkxMjM4MDgzOTgzMTI4MzF8VW5rbm93bnxUV0ZwYkdac2IzZDhleUpGYlhCMGVVMWhjR2tpT25SeWRXVXNJbFlpT2lJd0xqQXVNREF3TUNJc0lsQWlPaUpYYVc0ek1pSXNJa0ZPSWpvaVRXRnBiQ0lzSWxkVUlqb3lmUT09fDB8fHw%3d&sdata=bEZQTGM2Y2V3R2s2UUkxeEJ1UktlemNKOFNvVzBIaXJQc2hMM3JObVAvYz0%3d",
      "_blank"
    );
  };

  // =========================
  // ✅ Tool 4 — Modalités de paiements des assureurs (PDF)
  // =========================
  const _openPaymentTerms = () => {
    const filePath = "/documents/Modalites_Paiements_Assureurs.pdf";
    const link = document.createElement("a");
    link.href = filePath;
    link.download = "Modalites_Paiements_Assureurs.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // ✅ Tool 5 — Aide-mémoire Honoraires
  // =========================
  const _openAideMemoire = () => {
    // Remplacé par le nom du fichier Excel
    const filePath = "/documents/Aide_Memoire_Honoraires.xlsx"; 
    const link = document.createElement("a");
    link.href = filePath;
    link.download = "Aide_Memoire_Honoraires.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================
  // UI Meta
  // =========================
  const toolCount = 5;

  const helpText =
    "Entre les 3 premiers caractères du code postal (ex: G1P). La recherche démarre automatiquement.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="p-6 bg-white"
    >
      {/* Header */}
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
          </div>
        </div>
      </div>

      {/* Tool 1 — Succursale */}
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 text-sm text-gray-600"
            >
              ⏳ Recherche en cours…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!!error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
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

      {/* Tool 2 — Décoder NIV (VIN) */}
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Décoder un NIV (VIN)</h2>
              <span className="relative inline-flex group">
                <span className="cursor-help select-none inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs font-bold text-gray-700 bg-white">
                  ?
                </span>
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="block rounded-lg border bg-white shadow-sm px-3 py-2 text-xs text-gray-700">
                    <b>Source :</b> vPIC (NHTSA – U.S. DOT).
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
              if (vinResult) setVinResult(null);
              if (vinShowDetails) setVinShowDetails(false);
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-3 text-sm text-gray-600"
            >
              ⏳ Décodage en cours…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!!vinError && !vinLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 text-red-600 text-sm"
            >
              {vinError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {vinResult && !vinLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
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
                </div>
                <button
                  onClick={() => setVinShowDetails((v) => !v)}
                  className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition font-semibold"
                >
                  {vinShowDetails ? "Masquer les détails" : "Voir les détails"}
                </button>
              </div>

              <AnimatePresence>
                {vinShowDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
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
                      <DetailRow label="DriveType" value={vinResult.driveType} />
                      <DetailRow label="Carburant (principal)" value={vinResult.fuelTypePrimary} />
                      <DetailRow
                        label="Moteur"
                        value={[
                          vinResult.engineCylinders ? `${vinResult.engineCylinders} cyl` : "",
                          vinResult.displacementL ? `${vinResult.displacementL} L` : "",
                        ].filter(Boolean).join(" • ")}
                      />
                      <DetailRow label="Transmission (style)" value={vinResult.transmissionStyle} />
                      <DetailRow label="Transmission (vitesses)" value={vinResult.transmissionSpeeds} />
                      <DetailRow label="Usine (pays)" value={vinResult.plantCountry} />
                      <DetailRow label="Usine (ville)" value={vinResult.plantCity} />
                      <DetailRow label="Usine (état/province)" value={vinResult.plantState} />
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Certains champs peuvent être vides selon les informations disponibles.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tool 3 — Liste des codes d'agence */}
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Liste des codes d'agence</h2>
            <p className="text-sm text-gray-600 mt-1">
              Accède à la liste complète et à jour des codes d'agence.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-medium bg-white border px-3 py-1 rounded-full text-gray-700">
            SharePoint
          </span>
        </div>

        <button
          onClick={_openAgencyCodes}
          className="mt-5 w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition flex items-center justify-center gap-2 text-base"
        >
          Ouvrir la liste des codes d'agence (Excel)
        </button>
      </div>

      {/* Tool 4 — Modalités de paiements des assureurs */}
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Modalités de paiement des assureurs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Télécharge le document officiel des modalités et délais de paiement par assureur.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-medium bg-white border px-3 py-1 rounded-full text-gray-700">
            Document
          </span>
        </div>

        <button
          onClick={_openPaymentTerms}
          className="mt-5 w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition flex items-center justify-center gap-2 text-base"
        >
          Télécharger Modalités de paiement des assureurs (PDF)
        </button>
      </div>

      {/* ====================== NOUVEAU : Tool 5 — Aide-mémoire Honoraires ====================== */}
      <div className="mt-6 border rounded-xl p-5 bg-gray-50 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Aide-mémoire - Honoraires courtier facturation directe et agence</h2>
            <p className="text-sm text-gray-600 mt-1">
              Télécharge l'aide-mémoire concernant la facturation et les honoraires.
            </p>
          </div>
          <span className="hidden sm:inline-flex text-xs font-medium bg-white border px-3 py-1 rounded-full text-gray-700">
            Document
          </span>
        </div>

        <button
          onClick={_openAideMemoire}
          className="mt-5 w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition flex items-center justify-center gap-2 text-base"
        >
          Télécharger l'aide-mémoire (Excel)
        </button>
      </div>

    </motion.div>
  );
}
