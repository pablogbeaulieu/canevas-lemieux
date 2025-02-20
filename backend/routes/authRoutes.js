import express from "express";
import { supabase } from "../supabaseConfig.js";

const router = express.Router();

// 🔹 Inscription d'un utilisateur avec `username`, `first_name`, `nom`
router.post("/signup", async (req, res) => {
  console.log("📥 Requête reçue pour inscription :", req.body);

  // ✅ Correction : Transformer `lastName` en `nom`
  const { username, firstName, lastName, email, password, role } = req.body;
  const nom = lastName || ""; // 🔹 Empêche `nom` d'être `undefined`

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

    // ✅ Vérification : Afficher les données avant insertion
    const newUser = {
      id: userId,
      username,
      first_name: firstName,
      nom, // 🔹 `nom` au lieu de `last_name`
      email,
      role: role || "user",
      created_at: new Date(),
    };
    console.log("📤 Données envoyées à Supabase :", newUser);

    // 🔹 Insérer l'utilisateur dans la table `users`
    const { error: insertError } = await supabase.from("users").insert([newUser]);

    if (insertError) throw new Error(insertError.message);

    console.log("✅ Utilisateur ajouté dans `users` !");
    res.status(201).json({ message: "✅ Compte créé avec succès", user: data.user });

  } catch (error) {
    console.error("🔴 ERREUR :", error.message);
    return res.status(500).json({ error: `❌ Erreur Supabase : ${error.message}` });
  }
});

// 🔹 Connexion et récupération du rôle + infos utilisateur
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
      .eq("id", data.user.id)
      .single();

    if (userError) throw new Error("Impossible de récupérer l'utilisateur.");

    res.status(200).json({
      message: "✅ Connexion réussie",
      user: userData,
      access_token: data.session.access_token,
    });

  } catch (error) {
    console.error("🔴 ERREUR :", error.message);
    return res.status(500).json({ error: `❌ ${error.message}` });
  }
});

// 🔹 Récupérer le profil utilisateur (avec prénom, nom et rôle)
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "❌ Token manquant" });

  try {
    const { data: user, error } = await supabase.auth.getUser(token);

    if (error) throw new Error(error.message);

    // 🔹 Récupérer les infos du profil
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, username, first_name, nom, email, role")
      .eq("id", user.user.id)
      .single();

    if (profileError) throw new Error(profileError.message);

    res.status(200).json({ user: profile });

  } catch (error) {
    console.error("🔴 ERREUR :", error.message);
    return res.status(500).json({ error: `❌ ${error.message}` });
  }
});

export default router;
