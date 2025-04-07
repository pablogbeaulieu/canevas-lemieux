import { useEffect, useState } from "react";
import { supabase } from "../api";
import { motion } from "framer-motion";

function Dashboard() {
  const [news, setNews] = useState([]);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5); // on limite aux 5 dernières

    if (error) {
      console.error("Erreur lors du chargement des nouveautés :", error);
    } else {
      setNews(data);
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

      <section className="bg-gray-100 p-4 rounded-md shadow-md">
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
    </motion.div>
  );
}

export default Dashboard;
