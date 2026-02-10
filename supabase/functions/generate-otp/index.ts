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

const okJson = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, phone_number } = await req.json();

    if (!email || typeof email !== "string") {
      return okJson({ success: false, error: "Email talab qilinadi" });
    }

    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return okJson({ success: false, error: "Email formati noto'g'ri" });
    }

    if (!phone_number || typeof phone_number !== "string") {
      return okJson({ success: false, error: "Telefon raqam talab qilinadi" });
    }

    const inputDigits = phone_number.replace(/[^\d]/g, "");

    if (inputDigits.length < 9 || inputDigits.length > 15) {
      return okJson({ success: false, error: "Telefon raqam noto'g'ri" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return okJson({ success: false, error: "Bot sozlanmagan" });
    }

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    if (emailExists) {
      return okJson({ success: false, error: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    // Build phone number candidates (with and without spaces/formatting)
    const phoneCandidates = Array.from(new Set([
      phone_number.trim(),
      inputDigits,
      `+${inputDigits}`,
      inputDigits.startsWith("998") ? inputDigits : `998${inputDigits}`,
      inputDigits.startsWith("998") ? `+${inputDigits}` : `+998${inputDigits}`,
    ].filter(Boolean)));

    // Look up the user's chat_id from telegram_users table by phone number
    const { data: telegramUser, error: lookupError } = await supabaseAdmin
      .from("telegram_users")
      .select("chat_id, username, first_name, phone_number")
      .eq("is_active", true)
      .in("phone_number", phoneCandidates)
      .maybeSingle();

    if (lookupError || !telegramUser) {
      console.log(`Telegram user not found by phone: ${inputDigits}`);
      return okJson({
        success: false,
        error: `Bu telefon raqam bilan Telegram foydalanuvchi topilmadi. Avval @iqromaxbot ga /start yuboring va 📱 tugmasini bosing.`,
        error_code: "telegram_user_not_found",
      });
    }

    // Check if this phone number is already registered in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("phone_number", phoneCandidates)
      .maybeSingle();

    if (existingProfile) {
      return okJson({ success: false, error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
    }

    // Generate OTP and session token
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("is_used", false);

    // Insert new verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email,
        phone_number: phone_number,
        code,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_verified: false,
        telegram_id: telegramUser.chat_id,
        telegram_username: telegramUser.username || "",
        telegram_first_name: telegramUser.first_name || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return okJson({ success: false, error: "OTP yaratishda xatolik" });
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
      return okJson({
        success: false,
        error: "Telegram ga xabar yuborishda xatolik. Botga /start yuborganingizga ishonch hosil qiling.",
      });
    }

    console.log(`OTP sent to phone ${inputDigits} (chat_id: ${telegramUser.chat_id})`);

    return okJson({
      success: true,
      session_token: sessionToken,
      expires_in: 180,
      message: "OTP kod Telegram ga yuborildi",
    });
  } catch (error: any) {
    console.error("Error in generate-otp:", error);
    return okJson({ success: false, error: error.message });
  }
};

serve(handler);
