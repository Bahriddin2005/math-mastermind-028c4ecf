import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeeklyResult {
  user_id: string;
  username: string;
  email: string;
  total_score: number;
  problems_solved: number;
  best_streak: number;
  rank: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Weekly results email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the week range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Fetching results from ${weekStart.toISOString()} to ${now.toISOString()}`);

    // Get weekly game sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("game_sessions")
      .select("user_id, score, correct, best_streak")
      .gte("created_at", weekStart.toISOString());

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      throw sessionsError;
    }

    console.log(`Found ${sessions?.length || 0} sessions this week`);

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No sessions this week" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Aggregate scores by user
    const userScores = new Map<string, { score: number; problems: number; streak: number }>();
    sessions.forEach((session) => {
      const existing = userScores.get(session.user_id) || { score: 0, problems: 0, streak: 0 };
      userScores.set(session.user_id, {
        score: existing.score + (session.score || 0),
        problems: existing.problems + (session.correct || 0),
        streak: Math.max(existing.streak, session.best_streak || 0),
      });
    });

    const userIds = Array.from(userScores.keys());
    console.log(`Found ${userIds.length} unique users`);

    // Get user profiles and emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .in("user_id", userIds);

    // Get user emails from auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    const emailMap = new Map(
      authUsers?.users?.map((u) => [u.id, u.email]) || []
    );

    // Create ranked results
    const results: WeeklyResult[] = userIds
      .map((userId) => {
        const profile = profiles?.find((p) => p.user_id === userId);
        const scores = userScores.get(userId)!;
        return {
          user_id: userId,
          username: profile?.username || "Player",
          email: emailMap.get(userId) || "",
          total_score: scores.score,
          problems_solved: scores.problems,
          best_streak: scores.streak,
          rank: 0,
        };
      })
      .filter((r) => r.email)
      .sort((a, b) => b.total_score - a.total_score);

    results.forEach((r, i) => (r.rank = i + 1));

    console.log(`Sending emails to ${results.length} users`);

    // Send emails to each user
    const emailPromises = results.map(async (result) => {
      const topPlayers = results.slice(0, 5);
      const isTopPlayer = result.rank <= 3;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat { background: #f8f9fa; padding: 15px; border-radius: 12px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: bold; color: #6366f1; }
            .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
            .rank-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
            .rank-1 { background: linear-gradient(135deg, #ffd700, #ffb347); color: #333; }
            .rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: #333; }
            .rank-3 { background: linear-gradient(135deg, #cd7f32, #b87333); color: white; }
            .rank-other { background: #e0e0e0; color: #333; }
            .leaderboard { margin-top: 25px; }
            .leaderboard h3 { margin-bottom: 15px; color: #333; }
            .player { display: flex; align-items: center; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
            .player-rank { width: 30px; font-weight: bold; }
            .player-name { flex: 1; }
            .player-score { font-weight: bold; color: #6366f1; }
            .top-1 { background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,179,71,0.2)); }
            .top-2 { background: linear-gradient(135deg, rgba(192,192,192,0.2), rgba(160,160,160,0.2)); }
            .top-3 { background: linear-gradient(135deg, rgba(205,127,50,0.2), rgba(184,115,51,0.2)); }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Haftalik Natijalaringiz</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">IqroMax - Mental Arifmetika</p>
            </div>
            <div class="content">
              <div class="rank-badge ${result.rank === 1 ? 'rank-1' : result.rank === 2 ? 'rank-2' : result.rank === 3 ? 'rank-3' : 'rank-other'}">
                ${result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : '#' + result.rank} O'rin
              </div>
              
              <h2 style="margin: 0 0 20px;">Salom, ${result.username}! 👋</h2>
              
              ${isTopPlayer ? '<p style="color: #22c55e; font-weight: bold;">🎉 Tabriklaymiz! Siz bu hafta TOP-3 ga kirdingiz!</p>' : ''}
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${result.total_score.toLocaleString()}</div>
                  <div class="stat-label">Jami ball</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${result.problems_solved}</div>
                  <div class="stat-label">Masalalar</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${result.best_streak}</div>
                  <div class="stat-label">Eng yaxshi seriya</div>
                </div>
              </div>
              
              <div class="leaderboard">
                <h3>📊 Haftalik TOP-5</h3>
                ${topPlayers
                  .map(
                    (p, i) => `
                  <div class="player ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}">
                    <span class="player-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'}</span>
                    <span class="player-name">${p.username}${p.user_id === result.user_id ? ' (siz)' : ''}</span>
                    <span class="player-score">${p.total_score.toLocaleString()} ball</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
            <div class="footer">
              <p>Yangi haftada ham yutuqlar tilaymiz! 🚀</p>
              <p>IqroMax - Mental Arifmetika o'rganish platformasi</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const response = await resend.emails.send({
          from: "IqroMax <onboarding@resend.dev>",
          to: [result.email],
          subject: `🏆 Haftalik natijalaringiz - #${result.rank} o'rin!`,
          html,
        });
        console.log(`Email sent to ${result.email}:`, response);
        return { success: true, email: result.email };
      } catch (error) {
        console.error(`Failed to send email to ${result.email}:`, error);
        return { success: false, email: result.email, error: String(error) };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter((r) => r.success).length;

    console.log(`Successfully sent ${successCount}/${emailResults.length} emails`);

    return new Response(
      JSON.stringify({
        message: `Sent ${successCount} weekly result emails`,
        results: emailResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-weekly-results:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
