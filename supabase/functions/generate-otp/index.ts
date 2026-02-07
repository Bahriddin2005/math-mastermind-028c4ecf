import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu email allaqachon ro'yxatdan o'tgan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP and session token
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("is_used", false);

    // Insert new verification code with session token
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email,
        phone_number: "",
        code,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_verified: false,
        telegram_id: null,
        telegram_username: null,
        telegram_first_name: null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "OTP yaratishda xatolik" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`OTP generated for ${email}, code: ${code}, session: ${sessionToken}`);

    // Return the OTP code to be displayed to the user
    // User will send this code to the Telegram bot
    return new Response(
      JSON.stringify({
        success: true,
        otp_code: code,
        session_token: sessionToken,
        expires_in: 300, // 5 minutes in seconds
        message: "OTP kodni @iqromaxuzbot botga yuboring",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in generate-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
