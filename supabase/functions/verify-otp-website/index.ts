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
    const { session_token, otp_code, consume } = await req.json();

    if (!session_token || !otp_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Session token va OTP kod talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP kod 6 raqamdan iborat bo'lishi kerak" }),
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
      console.log("OTP not found for session:", session_token);
      return new Response(
        JSON.stringify({ success: false, error: "Session topilmadi" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(row.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP muddati tugagan. Yangi kod so'rang." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already used
    if (row.is_used) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu kod allaqachon ishlatilgan" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if OTP matches
    if (row.code !== otp_code) {
      console.log(`OTP mismatch for session: ${session_token}`);
      return new Response(
        JSON.stringify({ success: false, error: "Noto'g'ri kod. Qaytadan kiriting." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // OTP is correct! Check telegram identity from the saved record
    const telegramId = row.telegram_id;
    const telegramUsername = row.telegram_username;
    const telegramFirstName = row.telegram_first_name;

    if (!telegramId) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram ma'lumotlari topilmadi" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if this telegram account is already registered
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .or(`telegram_id.eq.${telegramId}${telegramUsername ? `,telegram_username.eq.${telegramUsername}` : ""}`)
      .maybeSingle();

    if (existingProfile) {
      console.log(`Telegram ${telegramId}/@${telegramUsername} already registered`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Bu Telegram akkaunt allaqachon ro'yxatdan o'tgan (${existingProfile.username}). Bitta Telegram = bitta akkaunt.`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If consume flag is true, mark as used
    if (consume) {
      await supabaseAdmin
        .from("verification_codes")
        .update({ is_used: true, is_verified: true })
        .eq("id", row.id);
      console.log(`OTP consumed for session: ${session_token}`);
    }

    // Return verified telegram data
    return new Response(
      JSON.stringify({
        success: true,
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        telegram_first_name: telegramFirstName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp-website:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
