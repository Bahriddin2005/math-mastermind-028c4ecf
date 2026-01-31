import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationPayload {
  email: string;
  phoneNumber: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Telegram configuration is missing');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload: VerificationPayload = await req.json();
    const { email, phoneNumber } = payload;

    if (!email || !phoneNumber) {
      throw new Error('Email and phone number are required');
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Mark all previous unused codes for this email as expired
    await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('email', email)
      .eq('is_used', false);

    // Store the verification code in database
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        phone_number: phoneNumber,
        code,
        expires_at: expiresAt,
        is_used: false
      });

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to store verification code');
    }

    // Escape special Markdown characters for MarkdownV2
    const escapeMarkdown = (text: string) => {
      return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
    };

    const safeEmail = escapeMarkdown(email);
    const safePhone = escapeMarkdown(phoneNumber);
    const safeCode = escapeMarkdown(code);

    // Format message for Telegram
    const message = `🔐 *RO'YXATDAN O'TISH KODI*\n\n` +
      `📧 *Email:* ${safeEmail}\n` +
      `📱 *Telefon:* ${safePhone}\n` +
      `\n🔢 *Tasdiqlash kodi:*\n\n` +
      `\`${safeCode}\`\n\n` +
      `⏰ _10 daqiqa ichida amal qiladi_`;

    console.log('Sending verification code to Telegram:', { email, phoneNumber });

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

    console.log('Verification code sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending verification code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
