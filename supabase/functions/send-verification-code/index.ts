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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram bot token is not configured');
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

    // Normalize phone number for lookup
    let normalizedPhone = phoneNumber.replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    console.log('Looking up Telegram user for phone:', normalizedPhone);

    // Find user's Telegram chat_id by phone number
    const { data: telegramUser, error: lookupError } = await supabase
      .from('telegram_users')
      .select('chat_id, first_name')
      .eq('phone_number', normalizedPhone)
      .eq('is_active', true)
      .single();

    if (lookupError || !telegramUser) {
      console.error('User not found in Telegram:', lookupError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'telegram_not_registered',
          message: 'Bu telefon raqam Telegram botga ulanmagan. Avval @iqromax_bot ga /start bosing va telefon raqamingizni ulashing.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatId = telegramUser.chat_id;
    const firstName = telegramUser.first_name || 'Foydalanuvchi';

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
        phone_number: normalizedPhone,
        code,
        expires_at: expiresAt,
        is_used: false
      });

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to store verification code');
    }

    // Format message for Telegram (using HTML for safety)
    const message = 
      `🔐 <b>IQROMAX - Tasdiqlash kodi</b>\n\n` +
      `Assalomu alaykum, ${firstName}!\n\n` +
      `Sizning tasdiqlash kodingiz:\n\n` +
      `<code>${code}</code>\n\n` +
      `⏰ Kod 10 daqiqa ichida amal qiladi.\n\n` +
      `⚠️ Bu kodni hech kimga bermang!`;

    console.log('Sending verification code to user Telegram:', { chatId, email });

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', result);
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }

    console.log('Verification code sent successfully to user');

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent to your Telegram' }),
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
