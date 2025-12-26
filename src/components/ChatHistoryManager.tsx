import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { 
  MessageCircle, 
  User, 
  Bot, 
  Clock, 
  Search,
  Eye,
  Trash2,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatSession {
  id: string;
  session_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  username?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const ChatHistoryManager = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    
    // Fetch sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      setLoading(false);
      return;
    }

    // Fetch message counts for each session
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('session_id');

    // Fetch profiles for user names
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username');

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);
    
    // Count messages per session
    const messageCounts = new Map<string, number>();
    messagesData?.forEach(m => {
      messageCounts.set(m.session_id, (messageCounts.get(m.session_id) || 0) + 1);
    });

    const enrichedSessions = sessionsData?.map(session => ({
      ...session,
      message_count: messageCounts.get(session.session_id) || 0,
      username: session.user_id ? profileMap.get(session.user_id) || 'Noma\'lum' : 'Mehmon'
    })) || [];

    setSessions(enrichedSessions);
    setLoading(false);
  };

  const viewSession = async (session: ChatSession) => {
    setSelectedSession(session);
    setDialogOpen(true);
    setLoadingMessages(true);

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.session_id)
      .order('created_at', { ascending: true });

    setSessionMessages((data as ChatMessage[]) || []);
    setLoadingMessages(false);
  };

  const deleteSession = async (sessionId: string) => {
    // Delete messages first
    await supabase.from('chat_messages').delete().eq('session_id', sessionId);
    // Then delete session
    const { error } = await supabase.from('chat_sessions').delete().eq('session_id', sessionId);
    
    if (!error) {
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      toast.success("Suhbat o'chirildi");
      setDialogOpen(false);
    } else {
      toast.error("Xatolik yuz berdi");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredSessions = sessions.filter(session => 
    session.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todaySessions = sessions.filter(s => 
    new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Jami suhbatlar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{todaySessions}</p>
            <p className="text-xs text-muted-foreground">Bugungi</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Bot className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalMessages}</p>
            <p className="text-xs text-muted-foreground">Jami xabarlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suhbat qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Chat tarixi</CardTitle>
          <CardDescription>Foydalanuvchilar bilan suhbatlar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Suhbatlar topilmadi</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {session.user_id ? (
                          <User className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{session.username}</p>
                          {!session.user_id && (
                            <Badge variant="secondary" className="text-xs">Mehmon</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(session.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {session.message_count} xabar
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewSession(session)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteSession(session.session_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Suhbat: {selectedSession?.username}
            </DialogTitle>
          </DialogHeader>
          
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {sessionMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-secondary rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.role === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
