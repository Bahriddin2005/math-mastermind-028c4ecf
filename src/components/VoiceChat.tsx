import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Crown, Circle, Loader2
} from "lucide-react";

interface VoiceChatProps {
  friend: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    vip_expires_at: string | null;
  };
  isOnline: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accept' | 'call-reject' | 'call-end';
  from: string;
  to: string;
  payload?: any;
}

export const VoiceChat = ({ friend, isOnline, open, onOpenChange }: VoiceChatProps) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isVip = friend.vip_expires_at && new Date(friend.vip_expires_at) > new Date();

  // Setup signaling channel
  useEffect(() => {
    if (!user || !open) return;

    const channelName = `voice-${[user.id, friend.user_id].sort().join('-')}`;
    
    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const message = payload as SignalingMessage;
        
        if (message.to !== user.id) return;

        switch (message.type) {
          case 'call-request':
            setCallState('receiving');
            break;
          case 'call-accept':
            await handleCallAccepted();
            break;
          case 'call-reject':
            handleCallRejected();
            break;
          case 'call-end':
            handleCallEnded();
            break;
          case 'offer':
            await handleOffer(message.payload);
            break;
          case 'answer':
            await handleAnswer(message.payload);
            break;
          case 'ice-candidate':
            await handleIceCandidate(message.payload);
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      cleanupCall();
    };
  }, [user, friend.user_id, open]);

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  const sendSignal = async (message: SignalingMessage) => {
    if (!channelRef.current) return;
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: message,
    });
  };

  const createPeerConnection = () => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && user) {
        sendSignal({
          type: 'ice-candidate',
          from: user.id,
          to: friend.user_id,
          payload: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected');
        setIsLoading(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnded();
      }
    };

    return pc;
  };

  const startCall = async () => {
    if (!user || !isOnline) {
      toast.error("Do'st hozir online emas");
      return;
    }

    setIsLoading(true);
    setCallState('calling');

    try {
      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Send call request
      await sendSignal({
        type: 'call-request',
        from: user.id,
        to: friend.user_id,
      });

      // Set timeout for no answer
      setTimeout(() => {
        if (callState === 'calling') {
          toast.error("Javob berilmadi");
          cleanupCall();
        }
      }, 30000);
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error("Mikrofonga ruxsat berilmadi");
      cleanupCall();
    }
  };

  const handleCallAccepted = async () => {
    if (!user || !localStreamRef.current) return;

    try {
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await sendSignal({
        type: 'offer',
        from: user.id,
        to: friend.user_id,
        payload: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      handleCallEnded();
    }
  };

  const acceptCall = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      await sendSignal({
        type: 'call-accept',
        from: user.id,
        to: friend.user_id,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error("Mikrofonga ruxsat berilmadi");
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (!user) return;

    await sendSignal({
      type: 'call-reject',
      from: user.id,
      to: friend.user_id,
    });

    cleanupCall();
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!user || !localStreamRef.current) return;

    try {
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await sendSignal({
        type: 'answer',
        from: user.id,
        to: friend.user_id,
        payload: answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      handleCallEnded();
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleCallRejected = () => {
    toast.error("Qo'ng'iroq rad etildi");
    cleanupCall();
  };

  const handleCallEnded = () => {
    cleanupCall();
  };

  const endCall = async () => {
    if (!user) return;

    await sendSignal({
      type: 'call-end',
      from: user.id,
      to: friend.user_id,
    });

    cleanupCall();
  };

  const cleanupCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('idle');
    setIsLoading(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (callState !== 'idle') {
      endCall();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Ovozli qo'ng'iroq</DialogTitle>
        </DialogHeader>

        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Friend avatar */}
          <div className="relative">
            <Avatar className={`h-24 w-24 border-4 ${
              callState === 'connected' ? 'border-green-500 animate-pulse' : 'border-background'
            }`}>
              <AvatarImage src={friend.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {friend.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
                isOnline ? 'bg-green-500' : 'bg-muted-foreground/50'
              }`}
            />
          </div>

          {/* Friend name */}
          <div className="text-center">
            <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
              {friend.username}
              {isVip && <Crown className="h-4 w-4 text-amber-500" />}
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Circle className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-muted-foreground/50 text-muted-foreground/50'}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>

          {/* Call status */}
          <div className="text-center h-8">
            {callState === 'idle' && (
              <p className="text-muted-foreground">Qo'ng'iroq qilish uchun tugmani bosing</p>
            )}
            {callState === 'calling' && (
              <p className="text-primary animate-pulse">Chaqirilmoqda...</p>
            )}
            {callState === 'receiving' && (
              <p className="text-green-500 animate-pulse">Kiruvchi qo'ng'iroq...</p>
            )}
            {callState === 'connected' && (
              <p className="text-green-500 font-mono">{formatDuration(callDuration)}</p>
            )}
          </div>

          {/* Call controls */}
          <div className="flex items-center gap-4">
            {callState === 'idle' && (
              <Button
                size="lg"
                onClick={startCall}
                disabled={!isOnline || isLoading}
                className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Phone className="h-6 w-6" />
                )}
              </Button>
            )}

            {callState === 'calling' && (
              <Button
                size="lg"
                variant="destructive"
                onClick={endCall}
                className="h-16 w-16 rounded-full"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {callState === 'receiving' && (
              <>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={rejectCall}
                  className="h-14 w-14 rounded-full"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={acceptCall}
                  disabled={isLoading}
                  className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Phone className="h-6 w-6" />
                  )}
                </Button>
              </>
            )}

            {callState === 'connected' && (
              <>
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  onClick={toggleMute}
                  className="h-14 w-14 rounded-full"
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={endCall}
                  className="h-16 w-16 rounded-full"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant={isSpeakerOn ? "secondary" : "outline"}
                  onClick={toggleSpeaker}
                  className="h-14 w-14 rounded-full"
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
