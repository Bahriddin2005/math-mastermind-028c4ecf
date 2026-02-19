import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const okJson = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token, otp_code, consume } = await req.json();

    if (!session_token || !otp_code) {
      return okJson({ success: false, error: "Session token va OTP kod talab qilinadi" });
    }

    if (!/^\d{6}$/.test(otp_code)) {
      return okJson({ success: false, error: "OTP kod 6 raqamdan iborat bo'lishi kerak" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find verification code
    const { data: row, error } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("session_token", session_token)
      .maybeSingle();

    if (error || !row) {
      return okJson({ success: false, error: "Session topilmadi" });
    }

    // Check expiry
    if (new Date(row.expires_at) < new Date()) {
      return okJson({ success: false, error: "OTP muddati tugagan. Yangi kod so'rang." });
    }

    // Check if used
    if (row.is_used) {
      return okJson({ success: false, error: "Bu kod allaqachon ishlatilgan" });
    }

    // Check attempts (max 5)
    if ((row.attempts || 0) >= 5) {
      return okJson({ success: false, error: "Juda ko'p urinish. Yangi kod so'rang." });
    }

    // Increment attempts
    await supabaseAdmin
      .from("verification_codes")
      .update({ attempts: (row.attempts || 0) + 1 })
      .eq("id", row.id);

    // Check code
    if (row.code !== otp_code) {
      return okJson({ success: false, error: "Noto'g'ri kod. Qaytadan kiriting." });
    }

    // Mark as used if consume flag
    if (consume) {
      await supabaseAdmin
        .from("verification_codes")
        .update({ is_used: true, is_verified: true })
        .eq("id", row.id);
    }

    return okJson({ success: true });
  } catch (error: any) {
    console.error("Error in verify-sms-otp:", error);
    return okJson({ success: false, error: error.message }, 500);
  }
};

serve(handler);
