import { useEffect, useState } from "react";
import { supabase } from "../api";
import { motion, AnimatePresence } from "framer-motion";

function Dashboard() {
  const [news, setNews] = useState([]);
  const [suggestionType, setSuggestionType] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error) setNews(data || []);
    else console.error("Erreur chargement nouveautés :", error);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionType || !suggestionText.trim()) {
      alert("Merci de remplir les deux champs !");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Session expirée. Merci de vous reconnecter.");
      return;
    }

    const { error } = await supabase.from("suggestions").insert([
      {
        category: suggestionType,
        content: suggestionText.trim(),
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'envoi :", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } else {
      setConfirmation("✅ Merci pour votre suggestion !");
      setSuggestionType("");
      setSuggestionText("");
      setTimeout(() => setConfirmation(""), 3000);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <motion.div
      className="p-6 bg-white"
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ✅ En-tête moderne (même style “clean”) */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 border border-blue-100">
          Tableau de bord
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Bienvenue
        </h1>

        <p className="mt-1 text-slate-600">
          Accédez rapidement aux nouveautés et proposez des idées d’amélioration.
        </p>
      </div>

      {/* ✅ Quoi de neuf (card plus clean) */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Quoi de neuf ?
            </h2>
            <p className="text-sm text-slate-600">
              Dernières mises à jour (max 5).
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          {news.length === 0 ? (
            <div className="rounded-lg border bg-slate-50 p-4 text-slate-600">
              Aucune nouveauté pour le moment.
            </div>
          ) : (
            <ul className="space-y-4">
              {news.map((item) => (
                <li key={item.id} className="rounded-lg border p-4 bg-white">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-slate-700">{item.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(item.created_at).toLocaleDateString("fr-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ✅ Suggestions (toggle + card animée, style cohérent) */}
      <div className="mt-6">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-800 font-semibold hover:bg-blue-100 transition"
        >
          {showSuggestions ? "Masquer les suggestions" : "Donner une suggestion"}
          <span className={`transition-transform ${showSuggestions ? "rotate-180" : "rotate-0"}`}>
            ▾
          </span>
        </button>

        <AnimatePresence>
          {showSuggestions && (
            <motion.section
              key="suggestions"
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="px-5 py-4 border-b">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Suggestions et idées
                  </h2>
                  <p className="text-sm text-slate-600">
                    Choisissez un type et décrivez votre idée.
                  </p>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Type de suggestion
                    </label>
                    <select
                      value={suggestionType}
                      onChange={(e) => setSuggestionType(e.target.value)}
                      className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Choisissez un type</option>
                      <option value="Ajout/modification canevas">
                        Ajout ou modification de canevas
                      </option>
                      <option value="Ajout/modification liste téléphonique">
                        Ajout ou modification de la liste téléphonique
                      </option>
                      <option value="Bug ou problème">Bug ou problème</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Détails
                    </label>
                    <textarea
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      placeholder="Décrivez votre idée ou problème ici…"
                      rows={4}
                      className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <button
                      onClick={handleSuggestionSubmit}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 transition"
                    >
                      Envoyer
                    </button>

                    <AnimatePresence>
                      {!!confirmation && (
                        <motion.p
                          key="confirmation"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="text-green-700 text-sm"
                        >
                          {confirmation}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Dashboard;
