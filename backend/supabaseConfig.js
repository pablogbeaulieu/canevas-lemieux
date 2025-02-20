import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Erreur : SUPABASE_URL ou SUPABASE_ANON_KEY manquant dans .env");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Évite de stocker les sessions côté serveur
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
