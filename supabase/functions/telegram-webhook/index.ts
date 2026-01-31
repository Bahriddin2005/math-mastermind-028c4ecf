import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    contact?: {
      phone_number: string;
      first_name: string;
      last_name?: string;
      user_id?: number;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const update: TelegramUpdate = await req.json();

    console.log('Received Telegram update:', JSON.stringify(update));

    if (update.message) {
      const chatId = update.message.chat.id.toString();
      const userId = update.message.from.id;
      const firstName = update.message.from.first_name;
      const lastName = update.message.from.last_name || '';
      const username = update.message.from.username || '';
      const text = update.message.text || '';

      // Handle /start command
      if (text === '/start') {
        const keyboard = {
          keyboard: [[{
            text: "📱 Telefon raqamni ulashish",
            request_contact: true
          }]],
          resize_keyboard: true,
          one_time_keyboard: true
        };

        await sendTelegramMessage(
          TELEGRAM_BOT_TOKEN,
          chatId,
          `Assalomu alaykum, ${firstName}! 👋\n\n` +
          `IQROMAX platformasiga xush kelibsiz!\n\n` +
          `Ro'yxatdan o'tish kodlarini olish uchun telefon raqamingizni ulashing. ` +
          `Quyidagi tugmani bosing:`,
          keyboard
        );
      }

      // Handle contact sharing
      if (update.message.contact) {
        let phoneNumber = update.message.contact.phone_number;
        
        // Normalize phone number (remove spaces, ensure + prefix)
        phoneNumber = phoneNumber.replace(/\s+/g, '');
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+' + phoneNumber;
        }

        console.log('Received contact:', { phoneNumber, chatId, firstName });

        // Save or update user in database
        const { error: upsertError } = await supabase
          .from('telegram_users')
          .upsert({
            phone_number: phoneNumber,
            chat_id: chatId,
            username: username,
            first_name: firstName,
            last_name: lastName,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'phone_number'
          });

        if (upsertError) {
          console.error('Database error:', upsertError);
          await sendTelegramMessage(
            TELEGRAM_BOT_TOKEN,
            chatId,
            `❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.`
          );
        } else {
          // Remove keyboard after successful registration
          await sendTelegramMessage(
            TELEGRAM_BOT_TOKEN,
            chatId,
            `✅ Telefon raqamingiz muvaffaqiyatli saqlandi!\n\n` +
            `📱 Raqam: ${phoneNumber}\n\n` +
            `Endi siz IQROMAX platformasida ro'yxatdan o'tganingizda, ` +
            `tasdiqlash kodi shu chatga keladi.`,
            { remove_keyboard: true }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  replyMarkup?: object
) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  console.log('Telegram response:', result);
  return result;
}
