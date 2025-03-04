import { createClient } from "@supabase/supabase-js";

// Utiliser les variables d'environnement
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Vérifier si les variables sont présentes
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les clés Supabase sont manquantes dans le fichier .env");
}

console.log("SUPABASE_URL:", process.env.REACT_APP_SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.REACT_APP_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
