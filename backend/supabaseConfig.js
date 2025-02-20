const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://whvqrenqdjrzbpmoetbi.supabase.co"; // Remplace par ton URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodnFyZW5xZGpyemJwbW9ldGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MTQ5NDQsImV4cCI6MjA1NTQ5MDk0NH0.sbVaLJCLPf8iNPiF2t_WoO9lxbLHAkbVjG9dx1CvEk4"; // Remplace par ta clé API publique

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
