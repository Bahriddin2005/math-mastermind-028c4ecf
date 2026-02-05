import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TelegramVerificationRequest {
  telegram_username: string;
  email: string;
  phone_number?: string;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!\\-]/g, '\\$&');
}

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    const result = await response.json();
    
    if (!result.ok) {
      console.error("Telegram API error:", result);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegram_username, email, phone_number }: TelegramVerificationRequest = await req.json();

    if (!telegram_username || !email) {
      throw new Error("Telegram username va email talab qilinadi");
    }

    // Clean up telegram username
    const cleanUsername = telegram_username.replace(/^@/, '').trim().toLowerCase();

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find user in telegram_users table by username
    const { data: telegramUser, error: findError } = await supabaseAdmin
      .from("telegram_users")
      .select("*")
      .ilike("username", cleanUsername)
      .eq("is_active", true)
      .single();

    if (findError || !telegramUser) {
      console.log("Telegram user not found:", cleanUsername);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Telegram foydalanuvchisi topilmadi. Iltimos, avval @iqromaxbot ga /start buyrug'ini yuboring." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
        phone_number: phone_number || "",
        code,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Tasdiqlash kodini yaratishda xatolik");
    }

    // Create the message
    const escapedCode = escapeMarkdownV2(code);
    const message = `🔐 *IQROMAX Tasdiqlash Kodi*

Sizning ro'yxatdan o'tish kodingiz:

\`${escapedCode}\`

⏱️ Kod 10 daqiqa davomida amal qiladi\\.

⚠️ Bu kodni hech kimga bermang\\!`;

    // Send code via Telegram
    const sent = await sendTelegramMessage(telegramUser.chat_id, message);

    if (!sent) {
      // Delete the code if sending failed
      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("email", email)
        .eq("code", code);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Telegram xabar yuborishda xatolik yuz berdi" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Verification code sent via Telegram to:", cleanUsername);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Tasdiqlash kodi Telegram orqali yuborildi" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-telegram-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
