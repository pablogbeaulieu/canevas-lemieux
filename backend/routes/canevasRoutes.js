import express from "express";
import { supabase } from "../supabaseConfig.js";

const router = express.Router();

// 🔹 Récupérer tous les canevas
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("canevas").select("*");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("🔴 Erreur lors de la récupération des canevas :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// 🔹 Ajouter un canevas
router.post("/", async (req, res) => {
  const { category, subCategory, title, content } = req.body;

  // Validation des champs obligatoires
  if (!category || !subCategory || !title || !content) {
    return res.status(400).json({ message: "❌ Tous les champs sont requis." });
  }

  try {
    const { error } = await supabase
      .from("canevas")
      .insert([{ category, subCategory, title, content }]);

    if (error) throw error;
    res.status(201).json({ message: "✅ Canevas ajouté avec succès." });
  } catch (error) {
    console.error("🔴 Erreur lors de l'ajout du canevas :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// 🔹 Modifier un canevas
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { category, subCategory, title, content } = req.body;

  if (!category || !subCategory || !title || !content) {
    return res.status(400).json({ message: "❌ Tous les champs sont requis pour la modification." });
  }

  try {
    const { error } = await supabase
      .from("canevas")
      .update({ category, subCategory, title, content })
      .eq("id", id);

    if (error) throw error;
    res.status(200).json({ message: `✅ Canevas (ID: ${id}) mis à jour avec succès.` });
  } catch (error) {
    console.error("🔴 Erreur lors de la mise à jour du canevas :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// 🔹 Supprimer un canevas
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from("canevas").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: `✅ Canevas (ID: ${id}) supprimé avec succès.` });
  } catch (error) {
    console.error("🔴 Erreur lors de la suppression du canevas :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// 🔹 Exportation correcte pour éviter l'erreur d'import
export default router;
