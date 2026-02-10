import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function okJson(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_token, otp_code, new_password, new_email } = await req.json();

    if (!session_token || !otp_code || !new_password) {
      return okJson({ success: false, error: "Session token, OTP kod va yangi parol talab qilinadi" });
    }

    if (!/^\d{6}$/.test(otp_code)) {
      return okJson({ success: false, error: "OTP kod 6 raqamdan iborat bo'lishi kerak" });
    }

    if (new_password.length < 6) {
      return okJson({ success: false, error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
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
      return okJson({ success: false, error: "Session topilmadi" });
    }

    if (new Date(row.expires_at) < new Date()) {
      return okJson({ success: false, error: "OTP muddati tugagan. Yangi kod so'rang." });
    }

    if (row.is_used) {
      return okJson({ success: false, error: "Bu kod allaqachon ishlatilgan" });
    }

    if (row.code !== otp_code) {
      return okJson({ success: false, error: "Noto'g'ri kod. Qaytadan kiriting." });
    }

    // Find user by email from verification_codes row
    const { data: allUsersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const allUsers = allUsersData?.users || [];
    const targetUser = allUsers.find(u => u.email === row.email);

    if (!targetUser) {
      return okJson({ success: false, error: "Foydalanuvchi topilmadi" });
    }

    // Step 1: Update password
    console.log(`Updating password for user ${targetUser.id} (${row.email})`);
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: new_password }
    );

    if (pwError) {
      console.error("Password update error:", pwError);
      return okJson({ success: false, error: "Parolni yangilashda xatolik: " + pwError.message });
    }

    console.log("Password updated successfully");

    // Step 2: Optionally update email
    let emailChanged = false;
    if (new_email && new_email.trim()) {
      const trimmedEmail = new_email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(trimmedEmail)) {
        // Password already updated, mark OTP used
        await supabaseAdmin.from("verification_codes").update({ is_used: true, is_verified: true }).eq("id", row.id);
        return okJson({ success: true, message: "Parol yangilandi, lekin email formati noto'g'ri", email_changed: false });
      }

      const otherUser = allUsers.find(u => u.email === trimmedEmail && u.id !== targetUser.id);
      if (otherUser) {
        await supabaseAdmin.from("verification_codes").update({ is_used: true, is_verified: true }).eq("id", row.id);
        return okJson({ success: true, message: "Parol yangilandi, lekin bu email allaqachon boshqa akkauntga tegishli", email_changed: false });
      }

      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { email: trimmedEmail, email_confirm: true }
      );

      if (emailError) {
        console.error("Email update error:", emailError);
        await supabaseAdmin.from("verification_codes").update({ is_used: true, is_verified: true }).eq("id", row.id);
        return okJson({ success: true, message: "Parol yangilandi, lekin emailni o'zgartirib bo'lmadi", email_changed: false });
      }
      emailChanged = true;
      console.log(`Email updated to ${trimmedEmail}`);
    }

    // Mark OTP as used
    await supabaseAdmin.from("verification_codes").update({ is_used: true, is_verified: true }).eq("id", row.id);

    console.log(`Password reset successful for ${row.email}`);

    return okJson({
      success: true,
      message: emailChanged
        ? "Parol va email muvaffaqiyatli yangilandi!"
        : "Parol muvaffaqiyatli yangilandi!",
      email_changed: emailChanged,
    });
  } catch (error: any) {
    console.error("Error in reset-password-confirm:", error);
    return okJson({ success: false, error: error.message });
  }
};

serve(handler);
