import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EgressClient, EncodedFileOutput, S3Upload, EncodedFileType } from "npm:livekit-server-sdk@^2.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
    const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");

    if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "LiveKit not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, sessionId, roomName, egressId } = await req.json();

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch session with admin client to avoid RLS issues
    const { data: session } = await adminSupabase
      .from("live_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session || session.teacher_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Only the teacher can manage recordings" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const egressClient = new EgressClient(livekitUrl, livekitApiKey, livekitApiSecret);
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

    if (action === "start") {
      // If there's already an active egress, try to stop it first
      if (session.egress_id) {
        try {
          await egressClient.stopEgress(session.egress_id);
        } catch (_e) {
          // Ignore - old egress may already be stopped
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filepath = `${sessionId}/${timestamp}.mp4`;

      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: filepath,
        output: {
          case: "s3",
          value: new S3Upload({
            accessKey: projectRef,
            secret: supabaseServiceKey,
            bucket: "recordings",
            endpoint: `${supabaseUrl}/storage/v1/s3`,
            region: "auto",
            forcePathStyle: true,
          }),
        },
      });

      const info = await egressClient.startRoomCompositeEgress(roomName, { file: fileOutput });

      await adminSupabase
        .from("live_sessions")
        .update({ egress_id: info.egressId, is_recording: true })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ success: true, egressId: info.egressId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stop") {
      // Always prefer the DB egress_id over what the frontend sends
      const activeEgressId = session.egress_id || egressId;
      
      if (!activeEgressId) {
        // No active egress - just reset the state
        await adminSupabase
          .from("live_sessions")
          .update({ egress_id: null, is_recording: false })
          .eq("id", sessionId);
        return new Response(
          JSON.stringify({ success: true, recordingUrl: "" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let recordingUrl = "";

      try {
        const info = await egressClient.stopEgress(activeEgressId);
        const fileResults = info.fileResults || [];
        if (fileResults.length > 0) {
          const filename = fileResults[0].filename;
          recordingUrl = `${supabaseUrl}/storage/v1/object/public/recordings/${filename}`;
        }
      } catch (stopErr: any) {
        const errMsg = stopErr?.message || String(stopErr);
        console.error("Stop egress error:", errMsg);
        
        // If egress is already ended/aborted, that's OK - just clean up
        if (errMsg.includes("cannot be stopped") || errMsg.includes("not found") || errMsg.includes("ABORTED") || errMsg.includes("COMPLETE")) {
          // Try to find the recording file in storage
          try {
            const { data: files } = await adminSupabase.storage
              .from("recordings")
              .list(sessionId, { limit: 10, sortBy: { column: "created_at", order: "desc" } });
            
            if (files && files.length > 0) {
              recordingUrl = `${supabaseUrl}/storage/v1/object/public/recordings/${sessionId}/${files[0].name}`;
            }
          } catch (_listErr) {
            // Ignore storage list errors
          }
        } else {
          // Real error - reset state but report it
          await adminSupabase
            .from("live_sessions")
            .update({ egress_id: null, is_recording: false })
            .eq("id", sessionId);
          return new Response(
            JSON.stringify({ success: false, error: "Yozib olishni to'xtatishda xatolik: " + errMsg }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Clean up session state
      await adminSupabase
        .from("live_sessions")
        .update({ egress_id: null, is_recording: false })
        .eq("id", sessionId);

      // Save recording if URL found
      if (recordingUrl) {
        await adminSupabase.from("recordings").insert({
          live_session_id: sessionId,
          recording_url: recordingUrl,
          title: session.title + " - Yozuv",
        });
      }

      return new Response(
        JSON.stringify({ success: true, recordingUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("LiveKit recording error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
