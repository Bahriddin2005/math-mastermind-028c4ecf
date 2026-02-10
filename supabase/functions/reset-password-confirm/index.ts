import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token, otp_code, new_password, new_email } = await req.json();

    if (!session_token || !otp_code || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "Session token, OTP kod va yangi parol talab qilinadi" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/^\d{6}$/.test(otp_code)) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP kod 6 raqamdan iborat bo'lishi kerak" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the verification code
    const { data: row, error } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("session_token", session_token)
      .maybeSingle();

    if (error || !row) {
      return new Response(
        JSON.stringify({ success: false, error: "Session topilmadi" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (new Date(row.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "OTP muddati tugagan. Yangi kod so'rang." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (row.is_used) {
      return new Response(
        JSON.stringify({ success: false, error: "Bu kod allaqachon ishlatilgan" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (row.code !== otp_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Noto'g'ri kod. Qaytadan kiriting." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = existingUsers?.users?.find(u => u.email === row.email);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Foydalanuvchi topilmadi" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build update payload
    const updatePayload: { password: string; email?: string } = { password: new_password };
    
    if (new_email && new_email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(new_email.trim())) {
        return new Response(
          JSON.stringify({ success: false, error: "Email formati noto'g'ri" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Check if email is already taken by another user
      const otherUser = existingUsers?.users?.find(u => u.email === new_email.trim() && u.id !== targetUser.id);
      if (otherUser) {
        return new Response(
          JSON.stringify({ success: false, error: "Bu email allaqachon boshqa akkauntga tegishli" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      updatePayload.email = new_email.trim();
    }

    // Update password (and optionally email)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      updatePayload
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Ma'lumotlarni yangilashda xatolik" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from("verification_codes")
      .update({ is_used: true, is_verified: true })
      .eq("id", row.id);

    const emailChanged = updatePayload.email ? ` Email: ${updatePayload.email}` : '';
    console.log(`Password reset successful for ${row.email}.${emailChanged}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: updatePayload.email 
          ? "Parol va email muvaffaqiyatli yangilandi!" 
          : "Parol muvaffaqiyatli yangilandi!",
        email_changed: !!updatePayload.email,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in reset-password-confirm:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
