import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    contact?: {
      phone_number: string;
      first_name?: string;
      last_name?: string;
      user_id?: number;
    };
  };
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!\\-]/g, "\\$&");
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "MarkdownV2",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("sendTelegramMessage error:", err);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured");
    return new Response("Bot token not configured", { status: 500 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = update.message;
  if (!message) {
    return new Response("OK", { status: 200 });
  }

  const chatId = message.chat.id;
  const fromUser = message.from;
  const text = message.text?.trim() ?? "";
  const contact = message.contact;

  console.log("Incoming update:", JSON.stringify(update, null, 2));

  // Handle /start command
  if (text.toLowerCase() === "/start") {
    const upsertData: Record<string, unknown> = {
      chat_id: String(chatId),
      username: fromUser?.username ?? null,
      first_name: fromUser?.first_name ?? null,
      last_name: fromUser?.last_name ?? null,
      phone_number: "",
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("telegram_users")
      .upsert(upsertData, { onConflict: "chat_id" });

    if (upsertErr) {
      console.error("Upsert error on /start:", upsertErr);
    }

    const welcomeText = escapeMarkdownV2(
      "Assalomu alaykum! 🎉\n\nIQROMAX platformasiga xush kelibsiz!\n\n📱 Telefon raqamingizni ulashing va saytda ro'yxatdan o'ting.\n\nSaytda username sifatida Telegram username'ingizni kiritasiz, sizga OTP kod shu yerga keladi."
    );

    await sendTelegramMessage(botToken, chatId, welcomeText, {
      keyboard: [
        [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    });

    return new Response("OK", { status: 200 });
  }

  // Handle contact sharing
  if (contact) {
    let phone = contact.phone_number ?? "";
    phone = phone.replace(/[^\d+]/g, "");
    if (!phone.startsWith("+") && phone.length >= 9) {
      phone = "+" + phone;
    }

    const upsertData: Record<string, unknown> = {
      chat_id: String(chatId),
      username: fromUser?.username ?? null,
      first_name: fromUser?.first_name ?? null,
      last_name: fromUser?.last_name ?? null,
      phone_number: phone,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from("telegram_users")
      .upsert(upsertData, { onConflict: "chat_id" });

    if (upsertErr) {
      console.error("Upsert error on contact:", upsertErr);
    }

    const successText = escapeMarkdownV2(
      `✅ Telefon raqamingiz saqlandi!\n\nEndi saytda ro'yxatdan o'tishda Telegram username'ingizni kiriting.\nSizga OTP kod shu yerga keladi.`
    );

    await sendTelegramMessage(botToken, chatId, successText, {
      remove_keyboard: true,
    });

    return new Response("OK", { status: 200 });
  }

  // Unknown message — give hint
  const hintText = escapeMarkdownV2(
    "📱 Iqromax.uz saytida ro'yxatdan o'tish uchun:\n\n1. Saytga kiring\n2. Telegram username'ingizni kiriting\n3. OTP kod shu yerga keladi\n4. Kodni saytga kiriting\n\nYoki /start buyrug'ini yuboring."
  );
  await sendTelegramMessage(botToken, chatId, hintText);

  return new Response("OK", { status: 200 });
};

serve(handler);
