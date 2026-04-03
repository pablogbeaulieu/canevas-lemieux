import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../api"; // 📌 Connexion à Supabase
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

function normalizeText(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève accents
    .toLowerCase()
    .trim();
}

// ✅ Téléchargement browser-safe
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ✅ CSV escaping (Excel-friendly)
function csvEscape(v) {
  const s = String(v ?? "");
  const needsQuotes = /[",\n\r;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function Repertoire() {
  const [contacts, setContacts] = useState([]);
  const [assureurs, setAssureurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedAssureur, setSelectedAssureur] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // États pour l'ajout d'un contact
  const [newAssureur, setNewAssureur] = useState("");
  const [newCategorie, setNewCategorie] = useState("");
  const [newTelephone, setNewTelephone] = useState("");
  const [newCourriel, setNewCourriel] = useState("");
  const [isNewAssureur, setIsNewAssureur] = useState(false);

  // États d’édition
  const [editingId, setEditingId] = useState(null);
  const [editedCategorie, setEditedCategorie] = useState("");
  const [editedTelephone, setEditedTelephone] = useState("");
  const [editedCourriel, setEditedCourriel] = useState("");

  // ✅ Recherche
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    fetchContacts();
    fetchAssureurs();
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("repertoire")
      .select("*")
      .order("assureur", { ascending: true });

    if (!error) setContacts(data || []);
    setLoading(false);
  };

  const fetchAssureurs = async () => {
    const { data, error } = await supabase
      .from("repertoire")
      .select("assureur")
      .order("assureur", { ascending: true });

    if (!error) {
      const uniqueAssureurs = [...new Set((data || []).map((item) => item.assureur))];
      setAssureurs(uniqueAssureurs);
    }
  };

  const fetchUserRole = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!userError) setUserRole(userData.role);
    }
  };

  const groupedContacts = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      if (!acc[contact.assureur]) acc[contact.assureur] = [];
      acc[contact.assureur].push(contact);
      return acc;
    }, {});
  }, [contacts]);

  const addContact = async () => {
    const assureurFinal = isNewAssureur ? newAssureur.trim() : newAssureur;

    if (!assureurFinal || !newCategorie || !newTelephone || !newCourriel) {
      alert("Tous les champs sont obligatoires !");
      return;
    }

    const { error } = await supabase.from("repertoire").insert([
      {
        assureur: assureurFinal,
        categorie: newCategorie,
        telephone: newTelephone,
        courriel: newCourriel,
      },
    ]);

    if (!error) {
      setNewAssureur("");
      setNewCategorie("");
      setNewTelephone("");
      setNewCourriel("");
      setIsNewAssureur(false);
      setShowAddForm(false);
      fetchContacts();
      fetchAssureurs();
    }
  };

  const startEditing = (contact) => {
    setEditingId(contact.id);
    setEditedCategorie(contact.categorie);
    setEditedTelephone(contact.telephone);
    setEditedCourriel(contact.courriel);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedCategorie("");
    setEditedTelephone("");
    setEditedCourriel("");
  };

  const saveEdits = async () => {
    const { error } = await supabase
      .from("repertoire")
      .update({
        categorie: editedCategorie,
        telephone: editedTelephone,
        courriel: editedCourriel,
      })
      .eq("id", editingId);

    if (!error) {
      fetchContacts();
      cancelEditing();
    }
  };

  const deleteContact = async (id) => {
    const confirmDelete = window.confirm("❌ Supprimer ce contact ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("repertoire").delete().eq("id", id);
    if (!error) fetchContacts();
  };

  const deleteAssureur = async (assureurName) => {
    const confirmDelete = window.confirm(
      `⚠️ Supprimer l'assureur "${assureurName}" et tous ses contacts ?`
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("repertoire").delete().eq("assureur", assureurName);

    if (!error) {
      fetchContacts();
      fetchAssureurs();
      if (selectedAssureur === assureurName) setSelectedAssureur(null);
    } else {
      alert("❌ Erreur lors de la suppression");
      console.error(error);
    }
  };

  // ✅ Auto focus quand search open
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      searchInputRef.current?.focus?.();
    }, 50);
    return () => clearTimeout(t);
  }, [searchOpen]);

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

  // ✅ Recherche
  const normalizedQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);
  const searchActive = searchOpen && normalizedQuery.length > 0;

  const assureurMatches = useMemo(() => {
    if (!searchActive) return [];
    const q = normalizedQuery;

    const matched = (assureurs || []).filter((a) => normalizeText(a).includes(q));
    matched.sort((a, b) => String(a).localeCompare(String(b), "fr", { sensitivity: "base" }));
    return matched.slice(0, 12);
  }, [searchActive, normalizedQuery, assureurs]);

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

  // =========================
  // ✅ EXPORT FUNCTIONS
  // =========================
  const getExportRows = () => {
    const rows = contacts.map((c) => ({ ...c }));

    rows.sort((a, b) => {
      const cmpA = String(a.assureur || "").localeCompare(String(b.assureur || ""), "fr", { sensitivity: "base" });
      if (cmpA !== 0) return cmpA;
      return String(a.categorie || "").localeCompare(String(b.categorie || ""), "fr", { sensitivity: "base" });
    });

    return rows;
  };

  const exportExcelCSV = () => {
    const rows = getExportRows();
    if (!rows.length) {
      alert("Aucun contact à exporter.");
      return;
    }

    const BOM = "\ufeff";
    const header = ["Assureur", "Catégorie", "Téléphone", "Courriel"];
    const lines = [
      header.map(csvEscape).join(";"),
      ...rows.map((r) =>
        [r.assureur, r.categorie, r.telephone, r.courriel].map(csvEscape).join(";")
      ),
    ];

    const csv = BOM + lines.join("\r\n");
    downloadBlob("repertoire_telephonique.csv", new Blob([csv], { type: "text/csv;charset=utf-8" }));
  };

  const exportWordDoc = () => {
    const rows = getExportRows();
    if (!rows.length) {
      alert("Aucun contact à exporter.");
      return;
    }

    const now = new Date().toLocaleString("fr-CA");

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Répertoire téléphonique</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
  h1 { font-size: 16pt; margin: 0 0 8px 0; }
  .meta { color: #666; font-size: 9pt; margin-bottom: 15px; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f8f9fa; }
</style>
</head>
<body>
  <h1>Répertoire téléphonique des assureurs</h1>
  <div class="meta">Exporté le ${now} — ${rows.length} contacts</div>
  <table>
    <thead>
      <tr>
        <th>Assureur</th>
        <th>Catégorie</th>
        <th>Téléphone</th>
        <th>Courriel</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map((r) => {
          const a = String(r.assureur ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const c = String(r.categorie ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const t = String(r.telephone ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const e = String(r.courriel ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          return `<tr><td>${a}</td><td>${c}</td><td>${t}</td><td>${e}</td></tr>`;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

    downloadBlob("repertoire_telephonique.doc", new Blob([html], { type: "application/msword" }));
  };

  return (
    <div className="p-6">
      {/* Header avec les deux boutons discrets */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Répertoire téléphonique</h1>
            <p className="text-white/80 text-sm mt-1">
              Trouve rapidement les contacts par assureur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {assureurs.length} assureurs
            </span>
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              {contacts.length} contacts
            </span>

            {/* === DEUX BOUTONS DISCRETS AJOUTÉS ICI === */}
            <button
              onClick={exportExcelCSV}
              title="Exporter tout le répertoire en Excel"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              📊 Excel
            </button>

            <button
              onClick={exportWordDoc}
              title="Exporter tout le répertoire en Word"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              📝 Word
            </button>

            {/* Recherche */}
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
                title="Rechercher un assureur"
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
                  placeholder="Rechercher un assureur"
                  className="w-[260px] bg-white/15 placeholder-white/60 text-white border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  onFocus={() => setSearchOpen(true)}
                />
              </motion.div>
            </div>

            {userRole === "admin" && !searchActive && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="ml-1 bg-white text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
              >
                {showAddForm ? "Fermer" : "Ajouter"}
              </button>
            )}
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

      {/* Formulaire d'ajout (admins seulement) */}
      {!searchActive && userRole === "admin" && (
        <div className="mb-6">
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              showAddForm ? "max-h-[800px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"
            }`}
          >
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="mb-3">
                <label className="block font-semibold mb-1">Assureur :</label>

                {!isNewAssureur ? (
                  <>
                    <select
                      value={newAssureur}
                      onChange={(e) => setNewAssureur(e.target.value)}
                      className="p-2 border rounded w-full mb-2"
                    >
                      <option value="">Sélectionner un assureur</option>
                      {assureurs.map((assureur, index) => (
                        <option key={index} value={assureur}>
                          {assureur}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setIsNewAssureur(true)}
                      className="text-blue-700 text-sm hover:underline"
                      type="button"
                    >
                      + Ajouter un nouvel assureur
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Nom de l'assureur"
                      value={newAssureur}
                      onChange={(e) => setNewAssureur(e.target.value)}
                      className="p-2 border rounded w-full mb-2"
                    />

                    <button
                      onClick={() => setIsNewAssureur(false)}
                      className="text-red-600 text-sm hover:underline"
                      type="button"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Catégorie"
                  value={newCategorie}
                  onChange={(e) => setNewCategorie(e.target.value)}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Téléphone"
                  value={newTelephone}
                  onChange={(e) => setNewTelephone(e.target.value)}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Courriel"
                  value={newCourriel}
                  onChange={(e) => setNewCourriel(e.target.value)}
                  className="p-2 border rounded w-full sm:col-span-2"
                />
              </div>

              <button
                onClick={addContact}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 w-full transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE RECHERCHE */}
      <AnimatePresence mode="wait">
        {searchActive ? (
          <motion.div
            key="searchMode"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.14 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Résultats</h2>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition font-semibold"
                type="button"
              >
                Effacer
              </button>
            </div>

            {assureurMatches.length === 0 ? (
              <div className="p-4 border rounded-xl bg-gray-50 text-gray-700">
                Aucun assureur trouvé pour “<b>{searchQuery.trim()}</b>”.
              </div>
            ) : (
              <div className="space-y-3">
                {assureurMatches.map((assureur) => (
                  <div key={assureur} className="border rounded-xl bg-white shadow-sm">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex items-center justify-between">
                      <div className="font-semibold text-lg">{assureur}</div>
                      <div className="text-xs text-gray-500">
                        {(groupedContacts[assureur] || []).length} contact(s)
                      </div>
                    </div>

                    <ul className="divide-y">
                      {(groupedContacts[assureur] || []).map((contact) => (
                        <li key={contact.id} className="p-3 hover:bg-gray-50 transition">
                          <div className="font-semibold">📌 {contact.categorie}</div>
                          <div className="text-gray-700 text-sm">
                            📞 {contact.telephone}
                            <span className="mx-2 text-gray-300">|</span>
                            ✉️ {contact.courriel}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* MODE NORMAL - Liste des assureurs */
          <motion.div
            key="normalMode"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.14 }}
          >
            {loading ? (
              <p>Chargement des contacts...</p>
            ) : (
              assureurs.map((assureur) => (
                <div key={assureur} className="mb-4">
                  <div
                    className="flex justify-between items-center bg-white p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-xl border shadow-sm"
                    onClick={() =>
                      setSelectedAssureur(selectedAssureur === assureur ? null : assureur)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-semibold">{assureur}</h2>

                      {userRole === "admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAssureur(assureur);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="Supprimer l’assureur"
                          type="button"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div
                      className={[
                        "w-8 h-8 rounded-lg border border-gray-200",
                        "flex items-center justify-center",
                        "text-gray-500 font-semibold",
                        "transition",
                        "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {selectedAssureur === assureur ? "–" : "+"}
                    </div>
                  </div>

                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      selectedAssureur === assureur
                        ? "max-h-[1200px] opacity-100 scale-100 mt-2"
                        : "max-h-0 opacity-0 scale-95"
                    }`}
                  >
                    <div className="bg-white border rounded-xl shadow-sm">
                      <ul className="divide-y">
                        {groupedContacts[assureur]?.map((contact) => (
                          <li
                            key={contact.id}
                            className="p-3 transition-all duration-200 hover:bg-gray-50"
                          >
                            {editingId === contact.id ? (
                              <div className="space-y-2">
                                <input
                                  value={editedCategorie}
                                  onChange={(e) => setEditedCategorie(e.target.value)}
                                  className="p-2 border rounded w-full"
                                />
                                <input
                                  value={editedTelephone}
                                  onChange={(e) => setEditedTelephone(e.target.value)}
                                  className="p-2 border rounded w-full"
                                />
                                <input
                                  value={editedCourriel}
                                  onChange={(e) => setEditedCourriel(e.target.value)}
                                  className="p-2 border rounded w-full"
                                />

                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={saveEdits}
                                    className="bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700"
                                    type="button"
                                  >
                                    💾 Enregistrer
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                                    type="button"
                                  >
                                    ✖️ Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="text-sm sm:text-base">
                                  <div className="font-semibold">📌 {contact.categorie}</div>
                                  <div className="text-gray-700">
                                    📞 {contact.telephone}
                                    <span className="mx-2 text-gray-300">|</span>
                                    ✉️ {contact.courriel}
                                  </div>
                                </div>

                                {userRole === "admin" && (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => startEditing(contact)}
                                      className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                                      type="button"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => deleteContact(contact.id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      type="button"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Repertoire;