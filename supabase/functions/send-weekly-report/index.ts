import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklyStats {
  totalGames: number;
  totalProblems: number;
  correctAnswers: number;
  accuracy: number;
  totalScore: number;
  bestStreak: number;
  avgTimePerProblem: number;
  improvement: number;
}

const getWeeklyStats = async (supabase: any, userId: string): Promise<WeeklyStats> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // This week's stats
  const { data: thisWeekSessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString());

  // Last week's stats for comparison
  const { data: lastWeekSessions } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString());

  const thisWeek = thisWeekSessions || [];
  const lastWeek = lastWeekSessions || [];

  const totalGames = thisWeek.length;
  const totalProblems = thisWeek.reduce((sum: number, s: any) => sum + (s.problems_solved || 0), 0);
  const correctAnswers = thisWeek.reduce((sum: number, s: any) => sum + (s.correct || 0), 0);
  const totalScore = thisWeek.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
  const bestStreak = Math.max(...thisWeek.map((s: any) => s.best_streak || 0), 0);
  const totalTime = thisWeek.reduce((sum: number, s: any) => sum + (s.total_time || 0), 0);
  
  const accuracy = totalProblems > 0 ? Math.round((correctAnswers / totalProblems) * 100) : 0;
  const avgTimePerProblem = totalProblems > 0 ? Math.round((totalTime / totalProblems) * 10) / 10 : 0;

  // Calculate improvement
  const lastWeekScore = lastWeek.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
  const improvement = lastWeekScore > 0 
    ? Math.round(((totalScore - lastWeekScore) / lastWeekScore) * 100) 
    : (totalScore > 0 ? 100 : 0);

  return {
    totalGames,
    totalProblems,
    correctAnswers,
    accuracy,
    totalScore,
    bestStreak,
    avgTimePerProblem,
    improvement,
  };
};

const generateEmailHtml = (username: string, stats: WeeklyStats): string => {
  const improvementColor = stats.improvement >= 0 ? '#22c55e' : '#ef4444';
  const improvementSign = stats.improvement >= 0 ? '+' : '';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IQROMAX - Haftalik Hisobot</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🧮 IQROMAX</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Haftalik Hisobot</p>
    </div>
    
    <!-- Main Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; margin-top: 0;">Assalomu alaykum! 👋</h2>
      <p style="color: #4b5563; line-height: 1.6;">
        <strong>${username}</strong>ning oxirgi haftalik natijalari tayyor! 
        Mana farzandingizning yutuqlari:
      </p>
      
      <!-- Stats Grid -->
      <div style="display: grid; gap: 15px; margin: 25px 0;">
        <!-- Row 1 -->
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1; background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">🎮</div>
            <div style="font-size: 24px; font-weight: bold; color: #166534;">${stats.totalGames}</div>
            <div style="color: #166534; font-size: 14px;">O'yin soni</div>
          </div>
          <div style="flex: 1; background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">🧮</div>
            <div style="font-size: 24px; font-weight: bold; color: #1e40af;">${stats.totalProblems}</div>
            <div style="color: #1e40af; font-size: 14px;">Masala yechildi</div>
          </div>
        </div>
        
        <!-- Row 2 -->
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1; background: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">🎯</div>
            <div style="font-size: 24px; font-weight: bold; color: #92400e;">${stats.accuracy}%</div>
            <div style="color: #92400e; font-size: 14px;">Aniqlik</div>
          </div>
          <div style="flex: 1; background: #fce7f3; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">⭐</div>
            <div style="font-size: 24px; font-weight: bold; color: #9d174d;">${stats.totalScore}</div>
            <div style="color: #9d174d; font-size: 14px;">Umumiy ball</div>
          </div>
        </div>
        
        <!-- Row 3 -->
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1; background: #f3e8ff; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">🔥</div>
            <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${stats.bestStreak}</div>
            <div style="color: #7c3aed; font-size: 14px;">Eng yaxshi seriya</div>
          </div>
          <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px;">⏱️</div>
            <div style="font-size: 24px; font-weight: bold; color: #047857;">${stats.avgTimePerProblem}s</div>
            <div style="color: #047857; font-size: 14px;">O'rtacha vaqt</div>
          </div>
        </div>
      </div>
      
      <!-- Improvement -->
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">O'tgan haftaga nisbatan</p>
        <div style="font-size: 36px; font-weight: bold; color: white;">
          ${improvementSign}${stats.improvement}%
        </div>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
          ${stats.improvement >= 0 ? '📈 Ajoyib natija!' : '💪 Yana harakat qiling!'}
        </p>
      </div>
      
      <!-- Recommendation -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #8b5cf6;">
        <h3 style="color: #1f2937; margin-top: 0;">💡 Tavsiya</h3>
        <p style="color: #4b5563; margin-bottom: 0; line-height: 1.6;">
          ${stats.accuracy >= 90 
            ? "Ajoyib aniqlik! Qiyinroq masalalarga o'ting." 
            : stats.accuracy >= 70 
              ? "Yaxshi natija! Kundalik mashqlarni davom ettiring."
              : "Ko'proq mashq qiling. Har kuni 10-15 daqiqa kifoya!"}
        </p>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://iqromax.uz" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold;">
          Platformaga o'tish →
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>Bu email IQROMAX platformasidan avtomatik yuborildi.</p>
      <p>© 2024 IQROMAX - Mental arifmetika platformasi</p>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: only allow service role or admin ---
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // If called via HTTP (not cron), validate the caller is admin
    if (authHeader?.startsWith("Bearer ")) {
      const anonClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await anonClient.auth.getUser(token);
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      // Check admin role
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }
    // If no auth header, assume it's a cron/internal call (service role)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with weekly report enabled
    const { data: preferences, error: prefError } = await supabase
      .from('parent_email_preferences')
      .select('*')
      .eq('weekly_report_enabled', true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    console.log(`Found ${preferences?.length || 0} users with weekly reports enabled`);

    const results = [];

    for (const pref of preferences || []) {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', pref.child_user_id || pref.user_id)
          .single();

        const username = profile?.username || 'Foydalanuvchi';

        // Get weekly stats
        const stats = await getWeeklyStats(supabase, pref.child_user_id || pref.user_id);

        // Skip if no activity
        if (stats.totalGames === 0) {
          console.log(`Skipping ${pref.email} - no activity this week`);
          continue;
        }

        // Send email
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: "IQROMAX <onboarding@resend.dev>",
          to: [pref.email],
          subject: `📊 ${username}ning haftalik hisoboti - IQROMAX`,
          html: generateEmailHtml(username, stats),
        });

        if (emailError) {
          console.error(`Error sending to ${pref.email}:`, emailError);
          results.push({ email: pref.email, success: false, error: emailError.message });
        } else {
          // Update last sent timestamp
          await supabase
            .from('parent_email_preferences')
            .update({ last_report_sent_at: new Date().toISOString() })
            .eq('id', pref.id);

          console.log(`Successfully sent to ${pref.email}`);
          results.push({ email: pref.email, success: true });
        }
      } catch (err: any) {
        console.error(`Error processing ${pref.email}:`, err);
        results.push({ email: pref.email, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-weekly-report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
