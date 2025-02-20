import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabaseConfig.js";
import authRoutes from "./routes/authRoutes.js"; // ✅ Vérifie que ce fichier existe
import canevasRoutes from "./routes/canevasRoutes.js"; // ✅ Vérifie que ce fichier existe

dotenv.config();

const app = express();
app.use(express.json()); // ✅ Nécessaire pour que Express comprenne le JSON
app.use(cors());

// 📌 Route principale
app.get("/", (req, res) => {
  res.send("✅ Backend Courtia en ligne 🚀");
});

// 📌 Ajout des routes d'authentification et de gestion des canevas
app.use("/auth", authRoutes);
app.use("/canevas", canevasRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
