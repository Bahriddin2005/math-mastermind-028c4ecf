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

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { telegram_username } = await req.json();

    if (!telegram_username) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram username talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const cleanUsername = telegram_username.replace(/^@/, "").trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram username noto'g'ri" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot sozlanmagan" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the profile with this telegram username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, telegram_id, telegram_username")
      .ilike("telegram_username", cleanUsername)
      .maybeSingle();

    if (profileError || !profile) {
      console.log(`Profile not found for telegram: @${cleanUsername}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `@${cleanUsername} bilan ro'yxatdan o'tgan akkaunt topilmadi`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Foydalanuvchi ma'lumotlari topilmadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up chat_id from telegram_users table
    const { data: telegramUser } = await supabaseAdmin
      .from("telegram_users")
      .select("chat_id, username")
      .ilike("username", cleanUsername)
      .eq("is_active", true)
      .maybeSingle();

    if (!telegramUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Telegram akkaunt topilmadi. Avval @iqromaxuzbot ga /start yuboring.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", userData.user.email)
      .eq("is_used", false);

    // Insert verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email: userData.user.email,
        phone_number: "",
        code,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_verified: false,
        telegram_id: telegramUser.chat_id,
        telegram_username: cleanUsername,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "OTP yaratishda xatolik" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP via Telegram
    const otpMessage = escapeMarkdownV2(
      `🔑 Iqromax.uz parolni tiklash kodi:\n\n${code}\n\n⏳ Kod 3 daqiqa amal qiladi.\nAgar bu siz bo'lmasangiz, e'tibor bermang.`
    );

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramUser.chat_id,
          text: otpMessage,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    if (!telegramRes.ok) {
      const errText = await telegramRes.text();
      console.error("Telegram send error:", errText);
      return new Response(
        JSON.stringify({ success: false, error: "Telegram ga xabar yuborishda xatolik" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Password reset OTP sent to @${cleanUsername} (chat_id: ${telegramUser.chat_id})`);

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        expires_in: 180,
        email_hint: userData.user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        message: "Parol tiklash kodi Telegram ga yuborildi",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in reset-password-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
