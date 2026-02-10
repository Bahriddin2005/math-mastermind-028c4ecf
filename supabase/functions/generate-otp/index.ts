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
    const { email, telegram_username } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email format validation
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email formati noto'g'ri" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!telegram_username || typeof telegram_username !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram username talab qilinadi" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Clean the username (remove @ if present)
    const cleanUsername = telegram_username.replace(/^@/, "").trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 32) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram username noto'g'ri (3-32 belgi)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate username format (alphanumeric + underscores only)
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram username faqat harf, raqam va _ bo'lishi mumkin" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Bot sozlanmagan" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu email allaqachon ro'yxatdan o'tgan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if telegram username is already registered in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telegram_username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu Telegram akkaunt allaqachon ro'yxatdan o'tgan" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Look up the user's chat_id from telegram_users table
    // They must have started the bot first (/start)
    const { data: telegramUser, error: lookupError } = await supabaseAdmin
      .from("telegram_users")
      .select("chat_id, username, first_name")
      .ilike("username", cleanUsername)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError || !telegramUser) {
      console.log(`Telegram user not found: @${cleanUsername}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `@${cleanUsername} topilmadi. Avval @iqromaxuzbot ga /start yuboring va 📱 tugmasini bosing.`,
          error_code: "telegram_user_not_found",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP and session token
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("is_used", false);

    // Insert new verification code with telegram data from telegram_users
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
        telegram_id: telegramUser.chat_id, // Real chat_id from telegram_users
        telegram_username: telegramUser.username || cleanUsername,
        telegram_first_name: telegramUser.first_name || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "OTP yaratishda xatolik" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send OTP to user via Telegram Bot API
    const otpMessage = escapeMarkdownV2(
      `🔐 Iqromax.uz ro'yxatdan o'tish kodi:\n\n${code}\n\n⏳ Kod 3 daqiqa amal qiladi.\nAgar bu siz bo'lmasangiz, e'tibor bermang.`
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
        JSON.stringify({
          success: false,
          error: "Telegram ga xabar yuborishda xatolik. Botga /start yuborganingizga ishonch hosil qiling.",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`OTP sent to @${cleanUsername} (chat_id: ${telegramUser.chat_id})`);

    return new Response(
      JSON.stringify({
        success: true,
        session_token: sessionToken,
        expires_in: 180, // 3 minutes
        message: "OTP kod Telegram ga yuborildi",
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
