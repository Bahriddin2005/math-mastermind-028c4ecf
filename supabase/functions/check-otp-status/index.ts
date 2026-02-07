import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token } = await req.json();

    if (!session_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Session token talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the verification code by session token
    const { data: row, error } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("session_token", session_token)
      .maybeSingle();

    if (error || !row) {
      return new Response(
        JSON.stringify({ success: false, status: "not_found", error: "Session topilmadi" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(row.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, status: "expired", error: "OTP muddati tugagan" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already used (account created)
    if (row.is_used) {
      return new Response(
        JSON.stringify({ success: false, status: "used", error: "Bu kod allaqachon ishlatilgan" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if verified by bot
    if (row.is_verified && row.telegram_id && row.telegram_username) {
      // Check if this telegram_id is already bound to a profile
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`telegram_id.eq.${row.telegram_id},telegram_username.eq.${row.telegram_username}`)
        .maybeSingle();

      if (existingProfile) {
        return new Response(
          JSON.stringify({
            success: false,
            status: "telegram_already_registered",
            error: "Bu Telegram akkaunt allaqachon ro'yxatdan o'tgan",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "verified",
          telegram_id: row.telegram_id,
          telegram_username: row.telegram_username,
          telegram_first_name: row.telegram_first_name,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Not yet verified — still waiting
    return new Response(
      JSON.stringify({ success: true, status: "pending" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in check-otp-status:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
