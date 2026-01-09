require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

// Vérification des variables d'environnement
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("🔴 Erreur : Variables d'environnement SUPABASE_URL et SUPABASE_KEY manquantes !");
  process.exit(1);
}

// Initialisation de Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Backend Courtia en ligne 🚀");
});

// 📌 Route pour récupérer tous les canevas
app.get("/canevas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("canevas").select("*");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("🔴 Erreur lors de la récupération des canevas :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 Route pour ajouter une nouvelle catégorie
app.post("/canevas", async (req, res) => {
  const { category, subCategory, title, content } = req.body;

  if (!category || !subCategory || !title || !content) {
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }

  try {
    const { error } = await supabase.from("canevas").insert([{ category, subCategory, title, content }]);

    if (error) throw error;
    res.status(201).json({ message: "✅ Catégorie ajoutée avec succès." });
  } catch (error) {
    console.error("🔴 Erreur lors de l'ajout de la catégorie :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 Route pour supprimer une catégorie
app.delete("/canevas/category/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const { error } = await supabase.from("canevas").delete().match({ category });

    if (error) throw error;
    res.status(200).json({ message: `✅ Catégorie "${category}" supprimée avec succès.` });
  } catch (error) {
    console.error("🔴 Erreur lors de la suppression de la catégorie :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 Route pour modifier une catégorie
app.put("/canevas/category/:category", async (req, res) => {
  const { category } = req.params;
  const { newTitle } = req.body;

  if (!newTitle) {
    return res.status(400).json({ message: "Le nouveau titre est requis" });
  }

  try {
    const { error } = await supabase.from("canevas").update({ category: newTitle }).match({ category });

    if (error) throw error;
    res.status(200).json({ message: `✅ Catégorie renommée en "${newTitle}".` });
  } catch (error) {
    console.error("🔴 Erreur lors de la modification de la catégorie :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
