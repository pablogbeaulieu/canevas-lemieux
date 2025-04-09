import { useEffect, useState } from "react";
import { supabase } from "../api";
import { motion, AnimatePresence } from "framer-motion";

function Dashboard() {
  const [news, setNews] = useState([]);
  const [suggestionType, setSuggestionType] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false); // 👈 Rétractable

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error) setNews(data);
    else console.error("Erreur chargement nouveautés :", error);
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestionType || !suggestionText.trim()) {
      alert("Merci de remplir les deux champs !");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("suggestions").insert([
      {
        category: suggestionType, // 👈 correction de "type" vers "category"
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
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Bienvenue sur le Tableau de Bord</h1>

      {/* Section Quoi de neuf */}
      <section className="bg-gray-100 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">🆕 Quoi de neuf ?</h2>
        {news.length === 0 ? (
          <p className="text-gray-600 italic">Aucune nouveauté pour le moment.</p>
        ) : (
          <ul className="space-y-4">
            {news.map((item) => (
              <li key={item.id} className="border-b pb-2">
                <h3 className="font-bold text-lg text-blue-800">{item.title}</h3>
                <p className="text-gray-700">{item.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString("fr-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bouton toggle pour les suggestions */}
      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="mb-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        {showSuggestions ? "🔽 Cacher les suggestions" : "📣 Donner une suggestion"}
      </button>

      {/* Section Suggestions - rétractable */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.section
            key="suggestions"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-md shadow-md border"
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-700">📣 Suggestions et idées</h2>

            <select
              value={suggestionType}
              onChange={(e) => setSuggestionType(e.target.value)}
              className="p-2 border rounded w-full mb-3"
            >
              <option value="">Choisissez un type</option>
              <option value="Ajout/modification canevas">Ajout ou modification de canevas</option>
              <option value="Ajout/modification liste téléphonique">Ajout ou modification de la liste téléphonique</option>
              <option value="Bug ou problème">Bug ou problème</option>
              <option value="Autre">Autre</option>
            </select>

            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="Décrivez votre idée ou problème ici..."
              rows={4}
              className="p-2 border rounded w-full mb-3"
            />

            <button
              onClick={handleSuggestionSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Envoyer la suggestion
            </button>

            {confirmation && <p className="text-green-600 mt-3">{confirmation}</p>}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Dashboard;
