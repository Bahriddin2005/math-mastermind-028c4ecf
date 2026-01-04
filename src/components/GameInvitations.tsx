import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Gamepad2, Clock, Check, X, Crown, Sparkles, Loader2
} from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Invitation {
  id: string;
  sender_id: string;
  room_code: string | null;
  game_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
    vip_expires_at: string | null;
  };
}

export const GameInvitations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerAchievementConfetti } = useConfetti();
  const { sendGameInviteNotification, permission } = usePushNotifications();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<Invitation | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadInvitations();

    // Subscribe to realtime invitations
    const channel = supabase
      .channel('game-invitations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_invitations',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('New invitation received:', payload);
          const newInvitation = payload.new as Invitation;
          
          // Load sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, vip_expires_at')
            .eq('user_id', newInvitation.sender_id)
            .single();
          
          const invitationWithProfile = {
            ...newInvitation,
            sender_profile: profile || undefined,
          };
          
          setCurrentInvitation(invitationWithProfile);
          setShowDialog(true);
          
          // Send push notification if permission granted
          if (permission === 'granted' && profile && newInvitation.room_code) {
            sendGameInviteNotification(profile.username, newInvitation.room_code);
          }
          
          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}
          
          toast.info(
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span>{profile?.username || 'Kimdir'} sizni o'yinga taklif qildi!</span>
            </div>,
            { duration: 5000 }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadInvitations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('game_invitations')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Load sender profiles
      const senderIds = data.map((inv) => inv.sender_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, vip_expires_at')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const invitationsWithProfiles = data.map((inv) => ({
        ...inv,
        sender_profile: profileMap.get(inv.sender_id),
      }));

      setInvitations(invitationsWithProfiles);
      
      // Show the first pending invitation
      if (invitationsWithProfiles.length > 0) {
        setCurrentInvitation(invitationsWithProfiles[0]);
        setShowDialog(true);
      }
    }
  };

  const respondToInvitation = async (accept: boolean) => {
    if (!currentInvitation || !user) return;

    setResponding(true);

    try {
      const { error } = await supabase
        .from('game_invitations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', currentInvitation.id);

      if (error) throw error;

      if (accept) {
        triggerAchievementConfetti();
        toast.success("Taklif qabul qilindi! O'yinga o'tmoqdamiz...");
        
        // Navigate to multiplayer room
        setTimeout(() => {
          if (currentInvitation.room_code) {
            navigate(`/mental-arithmetic?mode=multiplayer&room=${currentInvitation.room_code}`);
          } else {
            navigate('/mental-arithmetic?mode=multiplayer');
          }
        }, 1000);
      } else {
        toast.info("Taklif rad etildi");
      }

      setShowDialog(false);
      setCurrentInvitation(null);
      
      // Remove from local list
      setInvitations((prev) => prev.filter((inv) => inv.id !== currentInvitation.id));
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setResponding(false);
    }
  };

  const isVip = (vipExpires: string | null | undefined) => {
    return vipExpires && new Date(vipExpires) > new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return "Muddati tugadi";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentInvitation) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gamepad2 className="h-6 w-6 text-primary" />
            O'yin Taklifnomasi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sender info */}
          <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={currentInvitation.sender_profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-xl font-bold">
                {currentInvitation.sender_profile?.username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {currentInvitation.sender_profile?.username || 'Noma\'lum'}
                </h3>
                {isVip(currentInvitation.sender_profile?.vip_expires_at) && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                sizni o'yinga taklif qildi
              </p>
            </div>
          </div>

          {/* Game info */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Mental Arifmetika</p>
                <p className="text-sm text-muted-foreground">Multiplayer o'yin</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-mono">
                {getTimeRemaining(currentInvitation.expires_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => respondToInvitation(false)}
              disabled={responding}
            >
              <X className="h-4 w-4 mr-2" />
              Rad etish
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              onClick={() => respondToInvitation(true)}
              disabled={responding}
            >
              {responding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Qo'shilish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameInvitations;
