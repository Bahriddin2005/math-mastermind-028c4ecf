import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getZoomAccessToken(): Promise<string> {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=account_credentials&account_id=${accountId}`,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Zoom OAuth failed [${response.status}]: ${errorData}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createZoomMeeting(accessToken: string, params: {
  topic: string;
  start_time: string;
  duration: number;
  agenda?: string;
}) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.start_time,
      duration: params.duration,
      timezone: 'Asia/Tashkent',
      agenda: params.agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true,
        auto_recording: 'cloud',
        meeting_authentication: false,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Zoom API create meeting failed [${response.status}]: ${errorData}`);
  }

  return await response.json();
}

async function deleteZoomMeeting(accessToken: string, meetingId: string) {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.text();
    throw new Error(`Zoom API delete meeting failed [${response.status}]: ${errorData}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Check user is teacher or admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!roleData || (roleData.role !== 'teacher' && roleData.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Only teachers and admins can manage Zoom meetings' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { title, description, start_time, duration, course_id } = body;

      if (!title || !start_time || !duration) {
        return new Response(JSON.stringify({ error: 'title, start_time, duration required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accessToken = await getZoomAccessToken();
      const meeting = await createZoomMeeting(accessToken, {
        topic: title,
        start_time,
        duration,
        agenda: description,
      });

      // Save to live_sessions
      const roomName = `zoom-${meeting.id}`;
      const { data: session, error: insertError } = await supabase
        .from('live_sessions')
        .insert({
          teacher_id: userId,
          title,
          description: description || null,
          room_name: roomName,
          meeting_type: 'zoom',
          zoom_meeting_id: String(meeting.id),
          zoom_join_url: meeting.join_url,
          zoom_start_url: meeting.start_url,
          zoom_password: meeting.password || null,
          scheduled_at: start_time,
          status: 'scheduled',
          course_id: course_id || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`DB insert failed: ${insertError.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        session,
        zoom: {
          meeting_id: meeting.id,
          join_url: meeting.join_url,
          start_url: meeting.start_url,
          password: meeting.password,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'delete') {
      const { session_id } = body;

      // Get session
      const { data: session } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('teacher_id', userId)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete from Zoom if it's a zoom meeting
      if (session.zoom_meeting_id) {
        try {
          const accessToken = await getZoomAccessToken();
          await deleteZoomMeeting(accessToken, session.zoom_meeting_id);
        } catch (e) {
          console.error('Failed to delete Zoom meeting:', e);
        }
      }

      // Delete from DB
      await supabase
        .from('live_sessions')
        .delete()
        .eq('id', session_id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use: create, delete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('Zoom meeting error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
