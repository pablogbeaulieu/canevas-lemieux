/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-backup-token, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 Sécurité: token custom (NE PAS utiliser Authorization)
    const expectedToken = Deno.env.get("BACKUP_TOKEN");
    const token = req.headers.get("x-backup-token");

    if (!expectedToken || token !== expectedToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 🔑 Variables Supabase (Secrets)
    const supabaseUrl = Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing PROJECT_URL or SERVICE_ROLE_KEY." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1) Lire tous les canevas
    const { data: canevas, error: fetchErr } = await admin.from("canevas").select("*");
    if (fetchErr) {
      return new Response(JSON.stringify({ error: "Fetch failed", details: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Nom fichier (YYYY-MM-DD)
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `backup-canevas-${date}.json`;

    // 3) Upload dans Storage (bucket: backups)
    const payload = JSON.stringify({ created_at: new Date().toISOString(), canevas }, null, 2);

    const { error: uploadErr } = await admin.storage
      .from("backups")
      .upload(fileName, payload, { contentType: "application/json", upsert: true });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: "Upload failed", details: uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Purge > 30 jours
    const { data: files, error: listErr } = await admin.storage.from("backups").list("", { limit: 1000 });
    if (!listErr && files) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const toDelete = files
        .map((f) => f.name)
        .filter((name) => /^backup-canevas-\d{4}-\d{2}-\d{2}\.json$/.test(name))
        .filter((name) => {
          const m = name.match(/^backup-canevas-(\d{4}-\d{2}-\d{2})\.json$/);
          if (!m) return false;
          const dt = new Date(m[1] + "T00:00:00.000Z");
          return dt < cutoff;
        });

      if (toDelete.length > 0) {
        await admin.storage.from("backups").remove(toDelete);
      }
    }

    return new Response(JSON.stringify({ success: true, file: fileName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
