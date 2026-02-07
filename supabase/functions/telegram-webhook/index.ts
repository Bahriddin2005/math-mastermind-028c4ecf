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
    // Upsert user in telegram_users
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
      "Assalomu alaykum! 🎉\n\nIQROMAX platformasidan ro'yxatdan o'tish uchun:\n\n1. Saytda ro'yxatdan o'tish formani to'ldiring\n2. Sizga 6 raqamli OTP kod ko'rsatiladi\n3. O'sha kodni shu yerga yuboring\n\nYoki telefon raqamingizni ulashing:"
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
      `✅ Telefon raqamingiz saqlandi!\n\nEndi saytdan OTP kodni oling va shu yerga yuboring.`
    );

    await sendTelegramMessage(botToken, chatId, successText, {
      remove_keyboard: true,
    });

    return new Response("OK", { status: 200 });
  }

  // Handle OTP code input (6-digit number)
  if (/^\d{6}$/.test(text)) {
    console.log(`Received OTP attempt: ${text} from chat_id: ${chatId}, user: ${fromUser?.username}`);

    // Extract REAL telegram identity from the update object
    const telegramId = String(fromUser?.id ?? "");
    const telegramUsername = fromUser?.username ?? "";
    const telegramFirstName = fromUser?.first_name ?? "";

    if (!telegramId) {
      const errorText = escapeMarkdownV2("❌ Telegram ID aniqlanmadi. Qaytadan /start yuboring.");
      await sendTelegramMessage(botToken, chatId, errorText);
      return new Response("OK", { status: 200 });
    }

    // Check if this telegram_id or username is already registered (bound to a profile)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, username")
      .or(`telegram_id.eq.${telegramId}${telegramUsername ? `,telegram_username.eq.${telegramUsername}` : ""}`)
      .maybeSingle();

    if (existingProfile) {
      console.log(`Telegram ${telegramId}/@${telegramUsername} already registered as ${existingProfile.username}`);
      const alreadyText = escapeMarkdownV2(
        `❌ Bu Telegram akkaunt allaqachon ro'yxatdan o'tgan (${existingProfile.username}).\n\nBitta Telegram = bitta akkaunt.`
      );
      await sendTelegramMessage(botToken, chatId, alreadyText);
      return new Response("OK", { status: 200 });
    }

    // Find the OTP code that matches
    const { data: otpRow, error: otpError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("code", text)
      .eq("is_used", false)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (otpError || !otpRow) {
      console.log(`OTP not found or already used: ${text}`);
      const notFoundText = escapeMarkdownV2("❌ Noto'g'ri yoki eskirgan kod. Saytdan yangi kod oling.");
      await sendTelegramMessage(botToken, chatId, notFoundText);
      return new Response("OK", { status: 200 });
    }

    // Check if OTP expired
    if (new Date(otpRow.expires_at) < new Date()) {
      console.log(`OTP expired: ${text}`);
      const expiredText = escapeMarkdownV2("⏰ Kod muddati tugagan. Saytdan yangi kod oling.");
      await sendTelegramMessage(botToken, chatId, expiredText);
      return new Response("OK", { status: 200 });
    }

    // ✅ OTP is valid! Bind the REAL telegram identity to it
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({
        is_verified: true,
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        telegram_first_name: telegramFirstName,
      })
      .eq("id", otpRow.id);

    if (updateError) {
      console.error("Failed to update verification code:", updateError);
      const errorText = escapeMarkdownV2("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
      await sendTelegramMessage(botToken, chatId, errorText);
      return new Response("OK", { status: 200 });
    }

    console.log(`OTP ${text} verified for telegram_id: ${telegramId}, username: @${telegramUsername}`);

    const verifiedText = escapeMarkdownV2(
      `✅ Kod tasdiqlandi!\n\n👤 ${telegramFirstName}\n📱 @${telegramUsername || "username yo'q"}\n\nEndi saytga qayting — ro'yxatdan o'tish avtomatik davom etadi.`
    );
    await sendTelegramMessage(botToken, chatId, verifiedText);

    return new Response("OK", { status: 200 });
  }

  // Unknown message — give hint
  const hintText = escapeMarkdownV2(
    "📱 Saytdan olgan 6 raqamli OTP kodni shu yerga yuboring.\n\nYoki /start buyrug'ini yuboring."
  );
  await sendTelegramMessage(botToken, chatId, hintText);

  return new Response("OK", { status: 200 });
};

serve(handler);
