import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================
// HMAC-SHA256 Telegram hash verification
// ============================
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(sig);
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

function uint8ToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  selected_role?: string; // 'student' | 'teacher' — only used for new users
}

async function verifyTelegramAuth(data: TelegramAuthData, botToken: string): Promise<boolean> {
  const { hash, selected_role, ...rest } = data;
  if (!hash) return false;

  // 1. Check auth_date expiry (24 hours)
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 86400) {
    console.warn("Telegram auth_date expired:", { auth_date: data.auth_date, now });
    return false;
  }

  // 2. Build data-check string (sorted alphabetically, excluding hash and selected_role)
  const checkEntries = Object.entries(rest)
    .filter(([_, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = checkEntries.map(([k, v]) => `${k}=${v}`).join("\n");

  // 3. secret_key = SHA256(bot_token)
  const encoder = new TextEncoder();
  const secretKey = await sha256(encoder.encode(botToken));

  // 4. HMAC-SHA256(secret_key, data_check_string)
  const computedHash = await hmacSha256(secretKey, encoder.encode(dataCheckString));
  const computedHex = uint8ToHex(computedHash);

  // 5. Constant-time comparison
  return constantTimeEqual(computedHex, hash.toLowerCase());
}

// ============================
// Audit logging helper
// ============================
async function logAudit(
  supabase: any,
  action: string,
  userId: string | null,
  ip: string,
  userAgent: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      ip_address: ip,
      user_agent: userAgent,
      metadata,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

// Valid roles that can be selected during registration
const VALID_ROLES = ["student", "teacher"];

// ============================
// Main handler
// ============================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return new Response(JSON.stringify({ success: false, error: "Bot token not configured" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  let body: TelegramAuthData;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid request body" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate required fields
  if (!body.id || !body.auth_date || !body.hash) {
    await logAudit(supabase, "login_failed", null, ip, userAgent, {
      reason: "missing_fields",
      telegram_id: body.id,
    });
    return new Response(JSON.stringify({ success: false, error: "Ma'lumotlar to'liq emas" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ============================
  // 1. Verify Telegram hash (HMAC-SHA256)
  // ============================
  const isValid = await verifyTelegramAuth(body, botToken);

  if (!isValid) {
    await logAudit(supabase, "login_failed", null, ip, userAgent, {
      reason: "invalid_hash",
      telegram_id: body.id,
    });
    console.warn("Invalid Telegram hash for id:", body.id);
    return new Response(JSON.stringify({ success: false, error: "Autentifikatsiya muvaffaqiyatsiz" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ============================
  // 2. Check for replay attack
  // ============================
  const { data: replayCheck } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("action", "telegram_login")
    .eq("metadata->>telegram_id", String(body.id))
    .eq("metadata->>auth_date", String(body.auth_date))
    .limit(1);

  if (replayCheck && replayCheck.length > 0) {
    await logAudit(supabase, "replay_attack", null, ip, userAgent, {
      telegram_id: body.id,
      auth_date: body.auth_date,
    });
    return new Response(JSON.stringify({ success: false, error: "Autentifikatsiya muddati o'tgan" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ============================
  // 3. Find or create user
  // ============================
  const telegramId = String(body.id);
  const telegramUsername = body.username || "";
  const firstName = body.first_name || "";
  const lastName = body.last_name || "";
  const photoUrl = body.photo_url || "";

  // Validate selected_role (server-side enforcement — never trust frontend)
  const selectedRole = body.selected_role && VALID_ROLES.includes(body.selected_role)
    ? body.selected_role
    : "student";

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id, username, telegram_username, teacher_status")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  let authUserId: string;
  let isNewUser = false;

  if (existingProfile) {
    // Existing user — update profile if needed
    authUserId = existingProfile.user_id;

    await supabase.from("profiles").update({
      telegram_username: telegramUsername || existingProfile.telegram_username,
      first_name: firstName,
      avatar_url: photoUrl || undefined,
      updated_at: new Date().toISOString(),
    }).eq("user_id", authUserId);

  } else {
    // New user — create auth.users entry
    isNewUser = true;
    const email = `tg_${telegramId}@iqromax.uz`;
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        username: telegramUsername || firstName || `user_${telegramId}`,
        phone_number: null,
        user_type: selectedRole,
        telegram_id: telegramId,
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        const { data: users } = await supabase.auth.admin.listUsers({ filter: `email:${email}` });
        const found = users?.users?.find((u: any) => u.email === email);
        if (found) {
          authUserId = found.id;
          await supabase.from("profiles").update({
            telegram_id: telegramId,
            telegram_username: telegramUsername,
          }).eq("user_id", authUserId);
        } else {
          await logAudit(supabase, "login_failed", null, ip, userAgent, {
            reason: "user_creation_conflict",
            telegram_id: telegramId,
          });
          return new Response(JSON.stringify({ success: false, error: "Foydalanuvchi yaratishda xatolik" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("Create user error:", createError);
        await logAudit(supabase, "login_failed", null, ip, userAgent, {
          reason: "user_creation_error",
          telegram_id: telegramId,
          error: createError.message,
        });
        return new Response(JSON.stringify({ success: false, error: "Foydalanuvchi yaratishda xatolik" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      authUserId = newUser.user.id;

      // Update profile with telegram data and teacher_status
      const profileUpdate: Record<string, any> = {
        telegram_id: telegramId,
        telegram_username: telegramUsername,
        avatar_url: photoUrl || null,
      };

      if (selectedRole === "teacher") {
        profileUpdate.teacher_status = "pending";
      }

      await supabase.from("profiles").update(profileUpdate).eq("user_id", authUserId);

      // If teacher role was selected, the handle_new_user trigger already assigned it
      // But we need to make sure it's correct — override if needed
      if (selectedRole === "teacher") {
        // Delete auto-assigned student role and add teacher
        await supabase.from("user_roles").delete().eq("user_id", authUserId);
        await supabase.from("user_roles").insert({
          user_id: authUserId,
          role: "teacher",
        });
      }

      // Log role selection for audit
      await logAudit(supabase, "role_selected", authUserId, ip, userAgent, {
        telegram_id: telegramId,
        selected_role: selectedRole,
        is_new_user: true,
      });
    }
  }

  // ============================
  // 4. Generate session
  // ============================
  const email = `tg_${telegramId}@iqromax.uz`;

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData) {
    console.error("Generate link error:", linkError);
    await logAudit(supabase, "login_failed", authUserId!, ip, userAgent, {
      reason: "session_generation_failed",
      telegram_id: telegramId,
    });
    return new Response(JSON.stringify({ success: false, error: "Sessiya yaratishda xatolik" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const properties = linkData.properties;
  const accessToken = properties?.access_token;
  const refreshToken = properties?.refresh_token;

  // ============================
  // 5. Audit log — successful login
  // ============================
  await logAudit(supabase, "telegram_login", authUserId!, ip, userAgent, {
    telegram_id: telegramId,
    telegram_username: telegramUsername,
    auth_date: body.auth_date,
    method: "telegram_widget",
    is_new_user: isNewUser,
  });

  // ============================
  // 6. Get user roles and teacher_status
  // ============================
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authUserId!);

  const roles = roleData?.map((r: any) => r.role) || ["student"];

  // Get teacher_status if teacher
  let teacherStatus: string | null = null;
  if (roles.includes("teacher")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("teacher_status")
      .eq("user_id", authUserId!)
      .maybeSingle();
    teacherStatus = profile?.teacher_status || null;
  }

  return new Response(JSON.stringify({
    success: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    is_new_user: isNewUser,
    user: {
      id: authUserId,
      telegram_id: telegramId,
      username: telegramUsername || firstName,
      roles,
      teacher_status: teacherStatus,
    },
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
