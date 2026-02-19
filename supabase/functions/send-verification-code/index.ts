import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerificationRequest {
  email: string;
}

// ── Constants ───────────────────────────────────────────
const OTP_TTL_SECONDS = 300; // 5 daqiqa
const RESEND_COOLDOWN_SECONDS = 60; // 60 soniyada 1 marta
const DAILY_MAX_SENDS = 10; // kuniga max 10 ta

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

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerificationRequest = await req.json();

    if (!email || typeof email !== "string") {
      return jsonResponse({ success: false, error: "Email talab qilinadi" }, 400);
    }

    // Input validation
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, error: "Email formati noto'g'ri" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Rate Limiting: Resend cooldown (60s) ────────────
    const { data: recentCode } = await supabaseAdmin
      .from("verification_codes")
      .select("created_at")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCode) {
      const sinceSeconds = (Date.now() - new Date(recentCode.created_at).getTime()) / 1000;
      if (sinceSeconds < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - sinceSeconds);
        return jsonResponse({
          success: false,
          error: `Iltimos, ${wait} soniya kutib turing.`,
          retry_after: wait,
        }, 429);
      }
    }

    // ── Rate Limiting: Daily max sends (10/day) ─────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabaseAdmin
      .from("verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", todayStart.toISOString());

    if (todayCount !== null && todayCount >= DAILY_MAX_SENDS) {
      return jsonResponse({
        success: false,
        error: "Bugungi limit tugadi (10 ta). Ertaga qayta urinib ko'ring.",
      }, 429);
    }

    // Generate 6-digit code and session token
    const code = generateCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", normalizedEmail)
      .eq("is_used", false);

    // Insert new verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email: normalizedEmail,
        code,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        is_verified: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ success: false, error: "Kod yaratishda xatolik" }, 500);
    }

    // Send email with verification code
    const ttlMinutes = Math.floor(OTP_TTL_SECONDS / 60);
    const emailResponse = await resend.emails.send({
      from: "IQROMAX <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "IQROMAX – Tasdiqlash kodi",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">🧮 IQROMAX</h1>
                      <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Mental Matematika Platformasi</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #18181b; text-align: center;">
                        Tasdiqlash kodingiz
                      </h2>
                      <p style="margin: 0 0 24px; font-size: 15px; color: #71717a; text-align: center; line-height: 1.6;">
                        Ro'yxatdan o'tishni yakunlash uchun quyidagi kodni kiriting:
                      </p>
                      
                      <!-- Code Box -->
                      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #059669; font-family: 'Courier New', monospace;">${code}</span>
                      </div>
                      
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a1a1aa; text-align: center;">
                        ⏱️ Bu kod ${ttlMinutes} daqiqa davomida amal qiladi
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #a1a1aa; text-align: center;">
                        Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                        © ${new Date().getFullYear()} IQROMAX. Barcha huquqlar himoyalangan.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // Check Resend response for errors
    if (emailResponse.error) {
      console.error("Resend email error:", JSON.stringify(emailResponse.error));
      
      // Clean up the verification code since email failed
      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("session_token", sessionToken);

      return jsonResponse({
        success: false,
        error: "Email yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
      }, 200);
    }

    console.log("Verification email sent to:", normalizedEmail, "id:", emailResponse.data?.id);

    return jsonResponse({
      success: true,
      session_token: sessionToken,
      expires_in: OTP_TTL_SECONDS,
      message: "Tasdiqlash kodi email ga yuborildi",
    });
  } catch (error: any) {
    console.error("Error in send-verification-code:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
};

serve(handler);
