import express from "express";
import { supabase } from "../supabaseConfig.js";

const router = express.Router();

// 🔹 Inscription d'un utilisateur avec `username`, `first_name`, `nom`
router.post("/signup", async (req, res) => {
  console.log("📥 Requête reçue pour inscription :", req.body);

  const { username, firstName, lastName, email, password, role } = req.body;
  const nom = lastName || ""; 

  console.log("📌 Vérification des valeurs reçues :", { username, firstName, nom, email, password, role });

  if (!email || !password || !username || !firstName || !nom) {
    console.error("❌ Champs requis manquants :", { email, password, username, firstName, nom });
    return res.status(400).json({ error: "❌ Tous les champs sont requis." });
  }

  try {
    // 🔹 Création de l'utilisateur dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, firstName, nom, role: role || "user" },
      },
    });

    if (error) throw new Error(error.message);
    console.log("✅ Utilisateur Supabase créé :", data.user);

    const userId = data.user?.id;
    if (!userId) throw new Error("❌ ID utilisateur non récupéré.");

    // 🔹 Insérer l'utilisateur dans la table `users`
    const newUser = {
      id: userId,
      username,
      first_name: firstName,
      nom,
      email,
      role: role || "user",
      created_at: new Date(),
    };

    console.log("📤 Données envoyées à Supabase :", newUser);

    const { error: insertError } = await supabase.from("users").insert([newUser]);

    if (insertError) throw new Error(insertError.message);
    console.log("✅ Utilisateur ajouté dans `users` !");

    res.status(201).json({ message: "✅ Compte créé avec succès", user: data.user });

  } catch (error) {
    console.error("🔴 ERREUR :", error.message);
    return res.status(500).json({ error: `❌ Erreur Supabase : ${error.message}` });
  }
});

// 🔹 Connexion et récupération des infos utilisateur
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Requête reçue pour connexion :", req.body);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new Error(error.message);

    // 🔹 Récupérer les infos utilisateur dans `users`
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, first_name, nom, email, role")
      .eq("email", email)
      .single();

    if (userError) throw new Error(userError.message);

    console.log("✅ Utilisateur connecté :", userData);
    res.json({ message: "✅ Connexion réussie", user: userData });

  } catch (error) {
    console.error("🔴 ERREUR :", error.message);
    return res.status(500).json({ error: `❌ Erreur Supabase : ${error.message}` });
  }
});

export default router;
