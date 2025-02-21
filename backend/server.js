import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { supabase } from "./supabaseConfig.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 🔹 Routes d'authentification
app.use("/auth", authRoutes);

// 🔹 Route pour récupérer tous les utilisateurs
app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error("Erreur serveur lors de la récupération des utilisateurs :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// 🔹 Route pour mettre à jour le rôle d'un utilisateur
app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id);
    if (error) {
      console.error("Erreur lors de la mise à jour du rôle :", error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
  } catch (err) {
    console.error("Erreur serveur lors de la mise à jour du rôle :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// 🔹 Route pour récupérer les canevas
app.get("/canevas", async (req, res) => {
  console.log("📥 Requête reçue pour récupérer les canevas");

  try {
    const { data, error } = await supabase.from("canevas").select("*");

    if (error) {
      console.error("❌ Erreur récupération canevas :", error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Canevas récupérés :", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur serveur :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.listen(PORT, () => console.log(`🚀 Serveur en écoute sur le port ${PORT}`));
