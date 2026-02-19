import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Constants ───────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

interface VerifyRequest {
  session_token: string;
  code: string;
  consume?: boolean;
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token, code, consume = true }: VerifyRequest = await req.json();

    if (!session_token || typeof session_token !== "string") {
      return jsonResponse({ success: false, error: "Session token talab qilinadi" }, 400);
    }

    if (!code || typeof code !== "string") {
      return jsonResponse({ success: false, error: "Kod talab qilinadi" }, 400);
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(code)) {
      return jsonResponse({ success: false, error: "Kod 6 raqamdan iborat bo'lishi kerak" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars");
      return jsonResponse({ success: false, error: "Server sozlamasida xatolik" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the latest matching code by session_token
    const { data: row, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("session_token", session_token)
      .maybeSingle();

    if (fetchError || !row) {
      return jsonResponse({ success: false, error: "Session topilmadi" }, 404);
    }

    // ── Brute-force check: locked? ──────────────────────
    if (row.locked_until) {
      const lockExpiry = new Date(row.locked_until);
      if (new Date() < lockExpiry) {
        const remainMin = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
        return jsonResponse({
          success: false,
          error: `Ko'p urinish. ${remainMin} daqiqa kutib turing.`,
          locked: true,
        });
      }
      // Lock expired — reset attempts
      await supabaseAdmin
        .from("verification_codes")
        .update({ attempts: 0, locked_until: null })
        .eq("id", row.id);
      row.attempts = 0;
      row.locked_until = null;
    }

    // ── Check if already used ───────────────────────────
    if (row.is_used) {
      return jsonResponse({
        success: false,
        error: "Bu kod allaqachon ishlatilgan. Yangi kod so'rang.",
      });
    }

    // ── Check if expired ────────────────────────────────
    if (new Date(row.expires_at) < new Date()) {
      return jsonResponse({
        success: false,
        error: "Kod muddati tugagan. Yangi kod so'rang.",
        expired: true,
      });
    }

    // ── Check if code matches ───────────────────────────
    if (row.code !== code) {
      const newAttempts = (row.attempts || 0) + 1;
      const updates: Record<string, unknown> = { attempts: newAttempts };

      if (newAttempts >= MAX_ATTEMPTS) {
        updates.locked_until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
      }

      await supabaseAdmin
        .from("verification_codes")
        .update(updates)
        .eq("id", row.id);

      const remaining = Math.max(0, MAX_ATTEMPTS - newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        return jsonResponse({
          success: false,
          error: `Ko'p urinish. ${LOCK_MINUTES} daqiqa kutib turing.`,
          locked: true,
        });
      }

      return jsonResponse({
        success: false,
        error: `Noto'g'ri kod. ${remaining} ta urinish qoldi.`,
        remaining_attempts: remaining,
      });
    }

    // ── Code is correct! ────────────────────────────────
    if (consume) {
      const { error: updateError } = await supabaseAdmin
        .from("verification_codes")
        .update({ is_used: true, is_verified: true })
        .eq("id", row.id);

      if (updateError) {
        console.error("Failed to mark code as used:", updateError);
        return jsonResponse({ success: false, error: "Kod holatini yangilashda xatolik" }, 500);
      }
    }

    return jsonResponse({
      success: true,
      message: "Kod tasdiqlandi",
      email: row.email,
    });
  } catch (error: any) {
    console.error("Error in verify-code:", error);
    return jsonResponse({ success: false, error: error?.message ?? "Unknown error" }, 500);
  }
};

serve(handler);
