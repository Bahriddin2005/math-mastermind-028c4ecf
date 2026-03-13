import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EgressClient, EncodedFileOutput, EncodedFileType, S3Upload } from "npm:livekit-server-sdk@^2.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isExpectedStopError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("cannot be stopped") ||
    normalized.includes("not found") ||
    normalized.includes("aborted") ||
    normalized.includes("complete")
  );
};

const getProjectRef = (supabaseUrl: string) =>
  supabaseUrl.replace("https://", "").split(".")[0];

const sanitizeRecordingPath = (rawPath?: string | null) => {
  if (!rawPath) return null;
  let path = rawPath.replace(/^\/+/, "");
  if (path.startsWith("recordings/")) {
    path = path.slice("recordings/".length);
  }
  return path || null;
};

const buildPublicRecordingUrl = (supabaseUrl: string, recordingPath: string) =>
  `${supabaseUrl}/storage/v1/object/public/recordings/${recordingPath}`;

const findRecordingPath = async (
  adminSupabase: ReturnType<typeof createClient>,
  sessionId: string,
  preferredPath: string | null
) => {
  const preferredFileName = preferredPath?.split("/").pop() ?? null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const { data, error } = await adminSupabase.storage
      .from("recordings")
      .list(sessionId, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (!error && data?.length) {
      const mp4Files = data.filter(
        (file: { name?: string }) =>
          typeof file.name === "string" && file.name.toLowerCase().endsWith(".mp4")
      );

      if (mp4Files.length > 0) {
        if (preferredFileName) {
          const exactMatch = mp4Files.find((file: { name?: string }) => file.name === preferredFileName);
          if (exactMatch?.name) {
            return `${sessionId}/${exactMatch.name}`;
          }
        }

        const latest = mp4Files[0];
        if (latest?.name) {
          return `${sessionId}/${latest.name}`;
        }
      }
    }

    if (attempt < 19) {
      await sleep(3000);
    }
  }

  return null;
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, sessionId, roomName, egressId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "sessionId required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const projectRef = getProjectRef(supabaseUrl);

    if (action === "start") {
      if (session.egress_id) {
        try {
          await egressClient.stopEgress(session.egress_id);
        } catch {
          // ignore stale egress stop errors
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filepath = `${sessionId}/${timestamp}.mp4`;
      const storageEndpoint = `https://${projectRef}.storage.supabase.co/storage/v1/s3`;

      const s3AccessKey = Deno.env.get("SUPABASE_STORAGE_S3_ACCESS_KEY") || projectRef;
      const s3Secret = Deno.env.get("SUPABASE_STORAGE_S3_SECRET_KEY") || supabaseServiceKey;
      const s3Region =
        Deno.env.get("SUPABASE_STORAGE_S3_REGION") ||
        Deno.env.get("SB_REGION") ||
        "eu-central-1";

      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath,
        output: {
          case: "s3",
          value: new S3Upload({
            accessKey: s3AccessKey,
            secret: s3Secret,
            bucket: "recordings",
            endpoint: storageEndpoint,
            region: s3Region,
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
      const activeEgressId = session.egress_id || egressId;

      if (!activeEgressId) {
        await adminSupabase
          .from("live_sessions")
          .update({ egress_id: null, is_recording: false })
          .eq("id", sessionId);

        return new Response(
          JSON.stringify({ success: true, recordingUrl: "" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let expectedPath: string | null = null;

      try {
        const info = await egressClient.stopEgress(activeEgressId);
        expectedPath = sanitizeRecordingPath(info.fileResults?.[0]?.filename);
      } catch (stopErr: any) {
        const errorMessage = stopErr?.message || String(stopErr);
        console.error("Stop egress error:", errorMessage);

        if (!isExpectedStopError(errorMessage)) {
          await adminSupabase
            .from("live_sessions")
            .update({ egress_id: null, is_recording: false })
            .eq("id", sessionId);

          return new Response(
            JSON.stringify({ success: false, error: `Yozib olishni to'xtatishda xatolik: ${errorMessage}` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      await adminSupabase
        .from("live_sessions")
        .update({ egress_id: null, is_recording: false })
        .eq("id", sessionId);

      const recordingPath = await findRecordingPath(adminSupabase, sessionId, expectedPath);

      if (!recordingPath) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Video fayl hali tayyor bo'lmadi yoki saqlanmadi. Bir necha soniyadan keyin qayta urinib ko'ring.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const recordingUrl = buildPublicRecordingUrl(supabaseUrl, recordingPath);

      await adminSupabase.from("recordings").insert({
        live_session_id: sessionId,
        recording_url: recordingUrl,
        title: `${session.title} - Yozuv`,
      });

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
