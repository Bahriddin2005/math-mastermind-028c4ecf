import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'payment_approved' | 'payment_rejected' | 'payment_new';
  username?: string;
  planType: string;
  amount: number;
  adminNote?: string;
}

const PLAN_LABELS: Record<string, string> = {
  'bolajon_monthly': 'Bolajon PRO (Oylik)',
  'bolajon_yearly': 'Bolajon PRO (Yillik)',
  'ustoz_monthly': 'Ustoz PRO (Oylik)',
  'ustoz_yearly': 'Ustoz PRO (Yillik)',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    if (!TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID is not configured');
    }

    const payload: NotificationPayload = await req.json();
    const { type, username, planType, amount, adminNote } = payload;

    const formatAmount = (amt: number) => {
      return new Intl.NumberFormat('uz-UZ').format(amt) + " so'm";
    };

    let message = '';

    // Escape special Markdown characters
    const escapeMarkdown = (text: string) => {
      return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
    };

    const safeUsername = escapeMarkdown(username || 'Noma\'lum');
    const safePlanLabel = escapeMarkdown(PLAN_LABELS[planType] || planType);
    const safeAdminNote = adminNote ? escapeMarkdown(adminNote) : '';

    if (type === 'payment_new') {
      message = `🆕 *Yangi to'lov so'rovi\\!*\n\n` +
        `👤 Foydalanuvchi: ${safeUsername}\n` +
        `📦 Reja: ${safePlanLabel}\n` +
        `💰 Summa: ${formatAmount(amount)}\n` +
        `⏳ Tekshirishni kutmoqda`;
    } else if (type === 'payment_approved') {
      message = `✅ *To'lov tasdiqlandi\\!*\n\n` +
        `👤 Foydalanuvchi: ${safeUsername}\n` +
        `📦 Reja: ${safePlanLabel}\n` +
        `💰 Summa: ${formatAmount(amount)}\n` +
        (safeAdminNote ? `📝 Izoh: ${safeAdminNote}` : '');
    } else if (type === 'payment_rejected') {
      message = `❌ *To'lov rad etildi*\n\n` +
        `👤 Foydalanuvchi: ${safeUsername}\n` +
        `📦 Reja: ${safePlanLabel}\n` +
        `💰 Summa: ${formatAmount(amount)}\n` +
        (safeAdminNote ? `📝 Sabab: ${safeAdminNote}` : '');
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', result);
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }

    console.log('Telegram notification sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending Telegram notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
