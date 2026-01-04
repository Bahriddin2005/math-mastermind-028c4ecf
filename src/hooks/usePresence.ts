import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PresenceState {
  user_id: string;
  username: string;
  avatar_url: string | null;
  online_at: string;
}

interface OnlineUsers {
  [key: string]: PresenceState[];
}

interface UserProfile {
  username: string;
  avatar_url: string | null;
}

export const usePresence = (channelName: string = 'online-users') => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUsers>({});
  const [isTracking, setIsTracking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    };

    loadProfile();
  }, [user]);

  const isUserOnline = useCallback((userId: string) => {
    return Object.values(onlineUsers).some(presences =>
      presences.some(presence => presence.user_id === userId)
    );
  }, [onlineUsers]);

  const getOnlineUserIds = useCallback(() => {
    const userIds = new Set<string>();
    Object.values(onlineUsers).forEach(presences => {
      presences.forEach(presence => userIds.add(presence.user_id));
    });
    return Array.from(userIds);
  }, [onlineUsers]);

  useEffect(() => {
    if (!user || !userProfile) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        setOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: userProfile.username,
            avatar_url: userProfile.avatar_url,
            online_at: new Date().toISOString(),
          });
          setIsTracking(true);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setIsTracking(false);
    };
  }, [user, userProfile, channelName]);

  return {
    onlineUsers,
    isUserOnline,
    getOnlineUserIds,
    isTracking,
  };
};

export default usePresence;
