/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // ✅ CORS preflight MUST return 200
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // ✅ Vars (Secrets)
    const supabaseUrl = Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing PROJECT_URL or SERVICE_ROLE_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ✅ Must have JWT from logged-in user
    const authHeader = req.headers.get("authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client (bypass RLS)
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // ✅ Verify user + role=admin in your "users" table
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid user token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const { data: profile, error: profErr } = await admin
      .from("users")
      .select("role, isApproved")
      .eq("id", userId)
      .maybeSingle();

    if (profErr || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "admin" || profile.isApproved !== true) {
      return new Response(JSON.stringify({ error: "Forbidden (admin only)." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Fetch canevas
    const { data: canevas, error: fetchErr } = await admin.from("canevas").select("*");
    if (fetchErr) {
      return new Response(JSON.stringify({ error: "Fetch failed", details: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Unique filename (avoid overwrite)
    const iso = new Date().toISOString().replaceAll(":", "-");
    const fileName = `backup-canevas-${iso}.json`;

    const payload = JSON.stringify({ created_at: new Date().toISOString(), canevas }, null, 2);

    // ✅ Upload to Storage (bucket: backups)
    const { error: uploadErr } = await admin.storage
      .from("backups")
      .upload(fileName, new TextEncoder().encode(payload), {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: "Upload failed", details: uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Purge > 30 days
    const { data: files, error: listErr } = await admin.storage.from("backups").list("", { limit: 1000 });
    if (!listErr && files) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const toDelete = files
        .map((f) => f.name)
        .filter((name) => name.startsWith("backup-canevas-") && name.endsWith(".json"))
        .filter((name) => {
          // if parse fails, keep it (avoid deleting unknown)
          const m = name.match(/^backup-canevas-(\d{4}-\d{2}-\d{2})/);
          if (!m) return false;
          const dt = new Date(m[1] + "T00:00:00.000Z");
          return dt < cutoff;
        });

      if (toDelete.length > 0) {
        await admin.storage.from("backups").remove(toDelete);
      }
    }

    return new Response(JSON.stringify({ ok: true, file: fileName }), {
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
