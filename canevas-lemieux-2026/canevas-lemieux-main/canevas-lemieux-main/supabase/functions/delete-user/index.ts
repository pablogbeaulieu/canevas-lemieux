/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing PROJECT_URL or SERVICE_ROLE_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header (Bearer token)." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const targetUserId = body?.userId as string | undefined;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "userId is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client pour identifier l'appelant via son JWT
    const callerClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token / caller not found." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Vérifier que l'appelant est admin
    const { data: profile, error: profileErr } = await adminClient
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileErr || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cleanup optionnel (ne doit jamais faire échouer la suppression)
    await adminClient
      .from("password_reset_requests")
      .delete()
      .eq("user_id", targetUserId);

    await adminClient
      .from("suggestions")
      .delete()
      .eq("user_id", targetUserId);

    // Supprimer la ligne profil (public.users)
    await adminClient.from("users").delete().eq("id", targetUserId);

    // Supprimer le compte Auth (le vrai compte)
    const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (delAuthErr) {
      return new Response(
        JSON.stringify({ error: "Auth delete failed", details: delAuthErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
