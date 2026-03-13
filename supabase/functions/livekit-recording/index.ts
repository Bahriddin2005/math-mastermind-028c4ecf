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

    // Authenticate user
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

    // Verify teacher owns the session
    const { data: session } = await supabase
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

    // Extract project ref from supabase URL for S3 access
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

    if (action === "start") {
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

      // Save egress ID to session
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
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
      const activeEgressId = egressId || session.egress_id;
      if (!activeEgressId) {
        return new Response(
          JSON.stringify({ success: false, error: "No active recording found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const info = await egressClient.stopEgress(activeEgressId);

      // Get the file result to find the recording URL
      const fileResults = info.fileResults || [];
      let recordingUrl = "";
      if (fileResults.length > 0) {
        const filename = fileResults[0].filename;
        recordingUrl = `${supabaseUrl}/storage/v1/object/public/recordings/${filename}`;
      }

      // Update session and save recording
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
      await adminSupabase
        .from("live_sessions")
        .update({ egress_id: null, is_recording: false })
        .eq("id", sessionId);

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
      JSON.stringify({ success: false, error: "Invalid action. Use 'start' or 'stop'" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("LiveKit recording error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
