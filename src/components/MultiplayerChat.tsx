import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Smile, Zap, Trophy, Flame, ThumbsUp, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  type: 'message' | 'emoji' | 'system';
  created_at: string;
}

interface MultiplayerChatProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const quickEmojis = ['👍', '🎉', '🔥', '💪', '😎', '🚀', '⭐', '❤️'];

export const MultiplayerChat = ({ roomId, isOpen, onClose, className }: MultiplayerChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Realtime messages via broadcast
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`chat-${roomId}`)
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        const message = payload as ChatMessage;
        setMessages(prev => [...prev, message]);
        
        if (!isOpen && message.user_id !== user?.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, isOpen, user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (content: string, type: 'message' | 'emoji' = 'message') => {
    if (!content.trim() || !user || !profile) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      room_id: roomId,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      content: content.trim(),
      type,
      created_at: new Date().toISOString(),
    };

    // Broadcast message
    await supabase.channel(`chat-${roomId}`).send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message,
    });

    setNewMessage('');
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'emoji': return null;
      case 'system': return <Zap className="h-3 w-3" />;
      default: return null;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onClose}
        className={cn(
          "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-[10px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-scale-in",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold">Chat</span>
          <Badge variant="secondary" className="text-[10px] px-1.5">
            JONLI
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="h-72 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Hali xabarlar yo'q</p>
              <p className="text-xs mt-1">Birinchi bo'lib yozing!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === user?.id;
              const isEmoji = msg.type === 'emoji';
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 animate-fade-in",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwn && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={msg.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {msg.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[75%]",
                    isOwn ? "text-right" : "text-left"
                  )}>
                    {!isOwn && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 px-1">
                        {msg.username}
                      </p>
                    )}
                    <div className={cn(
                      "inline-block px-3 py-1.5 rounded-2xl text-sm break-words",
                      isEmoji 
                        ? "text-2xl px-0 py-0 bg-transparent" 
                        : isOwn 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Quick Emoji Bar */}
      {showEmojis && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center gap-1 animate-fade-in overflow-x-auto">
          {quickEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
              onClick={() => sendMessage(emoji, 'emoji')}
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t bg-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <Smile className={cn("h-5 w-5 transition-colors", showEmojis && "text-primary")} />
        </Button>
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing..."
          className="flex-1 bg-muted/50 border-0 focus-visible:ring-1"
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 bg-gradient-to-br from-primary to-primary/80"
          onClick={() => sendMessage(newMessage)}
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Chat toggle button component for use in MultiplayerMode
export const ChatToggleButton = ({ 
  roomId, 
  unreadCount = 0,
  onClick 
}: { 
  roomId: string;
  unreadCount?: number;
  onClick: () => void;
}) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="gap-2 relative"
    >
      <MessageCircle className="h-4 w-4" />
      Chat
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-[10px]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};
