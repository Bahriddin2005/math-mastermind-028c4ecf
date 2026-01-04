import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface UnreadCount {
  [friendId: string]: number;
}

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { sendLocalNotification, permission } = usePushNotifications();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount>({});
  const [totalUnread, setTotalUnread] = useState(0);

  // Load unread counts on mount
  useEffect(() => {
    if (!user) return;

    const loadUnreadCounts = async () => {
      const { data } = await supabase
        .from('friend_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (data) {
        const counts: UnreadCount = {};
        data.forEach(msg => {
          counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });
        setUnreadCounts(counts);
        setTotalUnread(data.length);
      }
    };

    loadUnreadCounts();

    // Subscribe to new messages
    const channel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            content: string;
          };

          // Update unread counts
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1,
          }));
          setTotalUnread(prev => prev + 1);

          // Get sender info for notification
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          if (senderProfile) {
            // Show toast notification
            toast.info(`${senderProfile.username}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`, {
              icon: '💬',
              duration: 5000,
            });

            // Send push notification if permission granted
            if (permission === 'granted') {
              sendLocalNotification(
                `Yangi xabar - ${senderProfile.username}`,
                {
                  body: newMessage.content.substring(0, 100),
                  icon: senderProfile.avatar_url || '/pwa-192x192.png',
                  tag: `message-${newMessage.sender_id}`,
                  data: {
                    type: 'message',
                    senderId: newMessage.sender_id,
                  },
                }
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, sendLocalNotification]);

  // Mark messages as read
  const markAsRead = useCallback(async (friendId: string) => {
    if (!user) return;

    await supabase
      .from('friend_messages')
      .update({ is_read: true })
      .eq('sender_id', friendId)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      const count = newCounts[friendId] || 0;
      delete newCounts[friendId];
      setTotalUnread(t => Math.max(0, t - count));
      return newCounts;
    });
  }, [user]);

  // Get unread count for specific friend
  const getUnreadCount = useCallback((friendId: string) => {
    return unreadCounts[friendId] || 0;
  }, [unreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    markAsRead,
    getUnreadCount,
  };
};

export default useMessageNotifications;
