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

const okJson = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

async function getEskizToken(): Promise<string> {
  const email = Deno.env.get("ESKIZ_EMAIL");
  const password = Deno.env.get("ESKIZ_PASSWORD");

  if (!email || !password) {
    throw new Error("Eskiz credentials not configured");
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Eskiz auth failed:", text);
    throw new Error("Eskiz auth failed");
  }

  const data = await res.json();
  return data.data?.token;
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  const token = await getEskizToken();

  const formData = new FormData();
  formData.append("mobile_phone", phone);
  formData.append("message", message);
  formData.append("from", "4546");

  const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Eskiz SMS send failed:", text);
    return false;
  }

  const data = await res.json();
  console.log("Eskiz SMS response:", JSON.stringify(data));
  return data.status === "waiting" || data.status === "success" || data.id;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, phone_number, username } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return okJson({ success: false, error: "Email talab qilinadi" });
    }
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return okJson({ success: false, error: "Email formati noto'g'ri" });
    }

    // Validate phone
    if (!phone_number || typeof phone_number !== "string") {
      return okJson({ success: false, error: "Telefon raqam talab qilinadi" });
    }
    const cleanPhone = phone_number.replace(/[^\d+]/g, "");
    const digits = cleanPhone.replace(/\D/g, "");
    if (digits.length < 12 || !digits.startsWith("998")) {
      return okJson({ success: false, error: "Telefon raqam noto'g'ri formatda. +998XXXXXXXXX" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some((u) => u.email === email);
    if (emailExists) {
      return okJson({ success: false, error: "Bu email allaqachon ro'yxatdan o'tgan" });
    }

    // Check if phone number is already registered
    const phoneCandidates = Array.from(
      new Set([
        phone_number.trim(),
        cleanPhone,
        digits,
        `+${digits}`,
      ].filter(Boolean))
    );

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .in("phone_number", phoneCandidates)
      .maybeSingle();

    if (existingProfile) {
      return okJson({ success: false, error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
    }

    // Rate limiting: check recent codes for this phone
    const { data: recentCodes } = await supabaseAdmin
      .from("verification_codes")
      .select("created_at")
      .eq("phone_number", cleanPhone)
      .gte("created_at", new Date(Date.now() - 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (recentCodes && recentCodes.length > 0) {
      return okJson({ success: false, error: "Juda tez-tez so'rov. 1 daqiqa kuting." });
    }

    // Generate OTP
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    // Delete old unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("is_used", false);

    // Insert verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email,
        phone_number: cleanPhone,
        code,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_verified: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return okJson({ success: false, error: "OTP yaratishda xatolik" });
    }

    // Send SMS via Eskiz
    const smsMessage = `IQROMAX tasdiqlash kodi: ${code}\nKod 3 daqiqa amal qiladi.`;
    const smsSent = await sendSMS(digits, smsMessage);

    if (!smsSent) {
      return okJson({
        success: false,
        error: "SMS yuborishda xatolik. Telefon raqamni tekshiring.",
      });
    }

    console.log(`SMS OTP sent to ${digits}`);

    return okJson({
      success: true,
      session_token: sessionToken,
      expires_in: 180,
      message: "SMS kod yuborildi",
    });
  } catch (error: any) {
    console.error("Error in send-sms-otp:", error);
    return okJson({ success: false, error: error.message });
  }
};

serve(handler);
