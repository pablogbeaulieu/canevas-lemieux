import { createClient } from "@supabase/supabase-js";

// Utiliser les variables d'environnement (CRA)
export const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
export const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les clés Supabase sont manquantes dans le fichier .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
