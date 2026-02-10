import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  email: string;
  code: string;
  /**
   * If true (default), marks the code as used.
   * If false, only validates the code without consuming it.
   */
  consume?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, consume = true }: VerifyRequest = await req.json();

    if (!email || typeof email !== "string" || !code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email va kod talab qilinadi" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Input validation
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Email formati noto'g'ri" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ success: false, error: "Kod 6 raqamdan iborat bo'lishi kerak" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server sozlamasida xatolik (credentials yo'q)",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the latest matching code (including used/expired) so we can return a clear reason
    const { data: row, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("id,email,code,is_used,expires_at")
      .eq("email", email)
      .eq("code", code)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (fetchError || !row) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Noto'g'ri kod",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (row.is_used) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bu kod allaqachon ishlatilgan. Yangi kod so'rang.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const nowIso = new Date().toISOString();
    if (row.expires_at <= nowIso) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Kod muddati o'tgan. Yangi kod so'rang.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (consume) {
      const { error: updateError } = await supabaseAdmin
        .from("verification_codes")
        .update({ is_used: true })
        .eq("id", row.id);

      if (updateError) {
        console.error("Failed to mark code as used:", updateError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Kod holatini yangilashda xatolik",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Code verified" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
