import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { useSound } from '@/hooks/useSound';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CourseManager } from '@/components/CourseManager';
import { ExamplesManager } from '@/components/ExamplesManager';
import { FAQManager } from '@/components/FAQManager';
import { ChatHistoryManager } from '@/components/ChatHistoryManager';
import { AdminUserCharts } from '@/components/AdminUserCharts';
import { FileManager } from '@/components/FileManager';
import { TestimonialsManager } from '@/components/TestimonialsManager';
import { AdminReports } from '@/components/AdminReports';
import { 
  Mail, 
  FileText, 
  Trash2, 
  Plus, 
  Edit, 
  Clock,
  User,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Users,
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Flame,
  GraduationCap,
  Calculator,
  HelpCircle,
  MessageCircle,
  FolderOpen,
  Upload,
  Quote,
  BarChart2,
  PlusCircle,
  Zap,
  RefreshCw,
  Download,
  Settings,
  Bell
} from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  read_time: string;
  icon: string;
  gradient: string;
  is_published: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  created_at: string;
  avatar_url: string | null;
}

interface GameSession {
  id: string;
  user_id: string;
  difficulty: string;
  section: string;
  score: number;
  correct: number;
  incorrect: number;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalProblems: number;
  totalScore: number;
  totalGames: number;
  newUsersToday: number;
  activeToday: number;
}

const ICON_OPTIONS = ['Brain', 'Calculator', 'Lightbulb', 'Target', 'TrendingUp', 'Sparkles', 'BookOpen'];
const GRADIENT_OPTIONS = [
  { label: "Ko'k", value: 'from-blue-500 to-cyan-500' },
  { label: 'Yashil', value: 'from-green-500 to-emerald-500' },
  { label: 'Sariq', value: 'from-yellow-500 to-orange-500' },
  { label: 'Binafsha', value: 'from-purple-500 to-pink-500' },
  { label: 'Qizil', value: 'from-red-500 to-rose-500' },
  { label: 'Indigo', value: 'from-indigo-500 to-violet-500' },
];
const CATEGORY_OPTIONS = ["Boshlang'ich", "Texnikalar", "Mashqlar", "Maslahatlar", "Dasturlar", "Bolalar uchun"];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProblems: 0,
    totalScore: 0,
    totalGames: 0,
    newUsersToday: 0,
    activeToday: 0,
  });
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: CATEGORY_OPTIONS[0],
    author: 'IQroMax jamoasi',
    read_time: '5 daqiqa',
    icon: 'BookOpen',
    gradient: GRADIENT_OPTIONS[0].value,
    is_published: false,
  });
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
      fetchBlogPosts();
      fetchUsers();
      fetchGameSessions();
      fetchStats();
      fetchAdminUsers();
    }
  }, [isAdmin]);

  const fetchAdminUsers = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    if (data) {
      setAdminUsers(data.map(r => r.user_id));
    }
  };

  const toggleAdminRole = async (userId: string) => {
    const isCurrentlyAdmin = adminUsers.includes(userId);
    
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (!error) {
        setAdminUsers(prev => prev.filter(id => id !== userId));
        toast.success("Admin huquqi olib tashlandi");
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (!error) {
        setAdminUsers(prev => [...prev, userId]);
        toast.success("Admin huquqi berildi");
      }
    }
  };

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (data) {
      setIsAdmin(true);
    } else {
      toast.error("Sizda admin huquqi yo'q");
      navigate('/');
    }
    setCheckingAdmin(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoadingMessages(false);
  };

  const fetchBlogPosts = async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBlogPosts(data);
    setLoadingPosts(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('total_score', { ascending: false });
    if (data) setUsers(data);
    setLoadingUsers(false);
  };

  const fetchGameSessions = async () => {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setGameSessions(data);
  };

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get profiles stats
    const { data: profiles } = await supabase.from('profiles').select('*');
    // Get game sessions count
    const { count: gamesCount } = await supabase.from('game_sessions').select('*', { count: 'exact', head: true });
    
    if (profiles) {
      const totalScore = profiles.reduce((sum, p) => sum + (p.total_score || 0), 0);
      const totalProblems = profiles.reduce((sum, p) => sum + (p.total_problems_solved || 0), 0);
      const newUsersToday = profiles.filter(p => p.created_at.startsWith(today)).length;
      const activeToday = profiles.filter(p => p.last_active_date === today).length;

      setStats({
        totalUsers: profiles.length,
        totalProblems,
        totalScore,
        totalGames: gamesCount || 0,
        newUsersToday,
        activeToday,
      });
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setMessageDialogOpen(true);
    if (!message.is_read) {
      await supabase.from('contact_messages').update({ is_read: true }).eq('id', message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success("Xabar o'chirildi");
      setMessageDialogOpen(false);
    }
  };

  const openBlogDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setBlogForm({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        author: post.author,
        read_time: post.read_time,
        icon: post.icon,
        gradient: post.gradient,
        is_published: post.is_published,
      });
    } else {
      setEditingPost(null);
      setBlogForm({
        title: '',
        excerpt: '',
        content: '',
        category: CATEGORY_OPTIONS[0],
        author: 'IQroMax jamoasi',
        read_time: '5 daqiqa',
        icon: 'BookOpen',
        gradient: GRADIENT_OPTIONS[0].value,
        is_published: false,
      });
    }
    setBlogDialogOpen(true);
  };

  const handleSavePost = async () => {
    if (!blogForm.title || !blogForm.excerpt || !blogForm.content) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    setSavingPost(true);
    try {
      if (editingPost) {
        const { error } = await supabase.from('blog_posts').update(blogForm).eq('id', editingPost.id);
        if (error) throw error;
        toast.success("Maqola yangilandi");
      } else {
        const { error } = await supabase.from('blog_posts').insert(blogForm);
        if (error) throw error;
        toast.success("Maqola yaratildi");
      }
      setBlogDialogOpen(false);
      fetchBlogPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (!error) {
      setBlogPosts(prev => prev.filter(p => p.id !== id));
      toast.success("Maqola o'chirildi");
    }
  };

  const togglePostPublish = async (post: BlogPost) => {
    const { error } = await supabase.from('blog_posts').update({ is_published: !post.is_published }).eq('id', post.id);
    if (!error) {
      setBlogPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: !p.is_published } : p));
      toast.success(post.is_published ? "Maqola yashirildi" : "Maqola chop etildi");
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

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-display font-bold truncate">Admin Panel</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Platforma boshqaruvi</p>
            </div>
          </div>

          {/* Stats Cards - 3 columns on mobile */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.totalUsers}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Users</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <Target className="h-4 w-4 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.totalProblems.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Yechilgan</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.totalScore.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Ball</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.totalGames}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">O'yin</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.newUsersToday}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Yangi</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 overflow-hidden">
              <CardContent className="p-2 sm:p-4 text-center">
                <Flame className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-base sm:text-2xl font-bold truncate">{stats.activeToday}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Faol</p>
              </CardContent>
            </Card>
          </div>

          {/* Tez harakatlar (Quick Actions) - Compact for mobile */}
          <Card className="mb-4 sm:mb-8 bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Tez harakatlar
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group overflow-hidden"
                  onClick={() => openBlogDialog()}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Maqola</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group overflow-hidden"
                  onClick={() => {
                    fetchUsers();
                    fetchStats();
                    toast.success("Ma'lumotlar yangilandi");
                  }}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Yangilash</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate('/courses')}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Kurslar</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate('/blog')}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Blog</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 group relative overflow-hidden"
                  onClick={() => {
                    const messagesTab = document.querySelector('[value="messages"]') as HTMLElement;
                    messagesTab?.click();
                  }}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Xabar</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] animate-pulse">{unreadCount}</Badge>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate('/settings')}
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center truncate w-full">Sozlama</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
            {/* Mobile: Grid tabs - all visible */}
            <div className="block md:hidden">
              <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm overflow-hidden">
                <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent p-1.5 gap-1">
                  <TabsTrigger value="users" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Users className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <BarChart2 className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Hisobot</span>
                  </TabsTrigger>
                  <TabsTrigger value="courses" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Kurs</span>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <FolderOpen className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Fayl</span>
                  </TabsTrigger>
                  <TabsTrigger value="examples" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Calculator className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Misol</span>
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent p-1.5 pt-0 gap-1">
                  <TabsTrigger value="faq" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-[9px] font-medium">FAQ</span>
                  </TabsTrigger>
                  <TabsTrigger value="testimonials" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Quote className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Sharh</span>
                  </TabsTrigger>
                  <TabsTrigger value="chats" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Mail className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Xabar</span>
                    {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 p-0 flex items-center justify-center text-[8px]">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <FileText className="h-4 w-4" />
                    <span className="text-[9px] font-medium">Blog</span>
                  </TabsTrigger>
                </TabsList>
              </Card>
            </div>

            {/* Desktop: Beautiful horizontal navigation */}
            <div className="hidden md:block">
              <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
                <TabsList className="relative grid w-full grid-cols-10 h-14 gap-0.5 bg-transparent p-1.5">
                  <TabsTrigger value="users" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-blue-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <Users className="h-4 w-4 text-blue-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-purple-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <BarChart2 className="h-4 w-4 text-purple-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Hisobot</span>
                  </TabsTrigger>
                  <TabsTrigger value="courses" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-emerald-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <GraduationCap className="h-4 w-4 text-emerald-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Kurslar</span>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-amber-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <FolderOpen className="h-4 w-4 text-amber-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Fayllar</span>
                  </TabsTrigger>
                  <TabsTrigger value="examples" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-cyan-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <Calculator className="h-4 w-4 text-cyan-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Misollar</span>
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-indigo-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <HelpCircle className="h-4 w-4 text-indigo-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">FAQ</span>
                  </TabsTrigger>
                  <TabsTrigger value="testimonials" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-pink-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <Quote className="h-4 w-4 text-pink-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Sharhlar</span>
                  </TabsTrigger>
                  <TabsTrigger value="chats" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-teal-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <MessageCircle className="h-4 w-4 text-teal-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Chatlar</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-red-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <Mail className="h-4 w-4 text-red-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Xabarlar</span>
                    {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] animate-pulse">{unreadCount}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="blog" className="relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300 hover:bg-orange-500/15 hover:-translate-y-0.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                    <FileText className="h-4 w-4 text-orange-500 group-data-[state=active]:text-white" />
                    <span className="text-[10px] font-medium truncate">Maqolalar</span>
                  </TabsTrigger>
                </TabsList>
              </Card>
            </div>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              {/* Statistics Charts */}
              <AdminUserCharts users={users} gameSessions={gameSessions} />

              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                  <CardTitle className="text-base sm:text-lg">Foydalanuvchilar</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Ro'yxatdan o'tganlar</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((profile, index) => (
                        <div key={profile.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 rounded-xl border bg-secondary/30 gap-2 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <span className="text-sm sm:text-lg font-bold text-muted-foreground w-6 sm:w-8 shrink-0">#{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <p className="font-semibold text-sm sm:text-base truncate">{profile.username}</p>
                                {adminUsers.includes(profile.user_id) && (
                                  <Badge variant="default" className="text-[10px] sm:text-xs h-4 sm:h-5">Admin</Badge>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                                {profile.total_problems_solved} masala · {profile.best_streak} seriya
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pl-8 sm:pl-0">
                            <div className="text-left sm:text-right">
                              <p className="text-base sm:text-xl font-bold text-primary">{profile.total_score.toLocaleString()}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(profile.created_at).split(',')[0]}</p>
                            </div>
                            {profile.user_id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3"
                                onClick={() => toggleAdminRole(profile.user_id)}
                              >
                                {adminUsers.includes(profile.user_id) ? (
                                  <><X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /><span className="hidden sm:inline">Admin o'chirish</span><span className="sm:hidden">O'chirish</span></>
                                ) : (
                                  <><ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /><span className="hidden sm:inline">Admin qilish</span><span className="sm:hidden">Admin</span></>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <AdminReports />
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card className="overflow-hidden">
                <CardContent className="p-2 sm:p-6">
                  <CourseManager isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card className="overflow-hidden">
                <CardContent className="p-2 sm:p-6">
                  <FileManager isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples">
              <ExamplesManager />
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <FAQManager />
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="testimonials">
              <TestimonialsManager />
            </TabsContent>

            {/* Chat History Tab */}
            <TabsContent value="chats">
              <ChatHistoryManager />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                  <CardTitle className="text-base sm:text-lg">Kontakt xabarlari</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Foydalanuvchilardan kelgan xabarlar</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Hali xabarlar yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-2 sm:p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${message.is_read ? 'bg-secondary/30' : 'bg-primary/5 border-primary/20'}`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                                {!message.is_read && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shrink-0" />}
                                <span className="font-semibold text-sm sm:text-base truncate">{message.name}</span>
                                <span className="text-[10px] sm:text-sm text-muted-foreground truncate">({message.email})</span>
                              </div>
                              <p className="font-medium text-xs sm:text-sm truncate">{message.subject}</p>
                              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{message.message}</p>
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap self-end sm:self-start">{formatDate(message.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Blog Tab */}
            <TabsContent value="blog">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-6">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Blog maqolalari</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Maqolalarni yaratish va tahrirlash</CardDescription>
                  </div>
                  <Button onClick={() => openBlogDialog()} size="sm" className="w-full sm:w-auto h-8 sm:h-10">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Yangi maqola
                  </Button>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                  {loadingPosts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : blogPosts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Hali maqolalar yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="p-2 sm:p-4 rounded-xl border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                              <span className="font-semibold text-sm sm:text-base truncate">{post.title}</span>
                              <Badge variant={post.is_published ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-4 sm:h-5">
                                {post.is_published ? 'Chop etilgan' : 'Qoralama'}
                              </Badge>
                            </div>
                            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{post.excerpt}</p>
                            <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-0.5 sm:gap-1"><User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{post.author}</span>
                              <span className="flex items-center gap-0.5 sm:gap-1"><Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />{post.read_time}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs h-4 sm:h-5">{post.category}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 self-end sm:self-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9" onClick={() => togglePostPublish(post)}>
                              {post.is_published ? <X className="h-3 w-3 sm:h-4 sm:w-4" /> : <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9" onClick={() => openBlogDialog(post)}>
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-9 sm:w-9" onClick={() => handleDeletePost(post.id)}>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>{selectedMessage?.name} ({selectedMessage?.email})</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">{selectedMessage && formatDate(selectedMessage.created_at)}</p>
            <p className="whitespace-pre-wrap">{selectedMessage?.message}</p>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => selectedMessage && handleDeleteMessage(selectedMessage.id)}>
              <Trash2 className="h-4 w-4 mr-2" />O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blog Post Dialog */}
      <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Maqolani tahrirlash' : 'Yangi maqola'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sarlavha</Label>
              <Input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} placeholder="Maqola sarlavhasi" />
            </div>
            <div className="space-y-2">
              <Label>Qisqa tavsif</Label>
              <Textarea value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} placeholder="Maqola haqida qisqacha..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>To'liq matn</Label>
              <Textarea value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} placeholder="Maqola matni..." rows={6} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategoriya</Label>
                <Select value={blogForm.category} onValueChange={(value) => setBlogForm({ ...blogForm, category: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>O'qish vaqti</Label>
                <Input value={blogForm.read_time} onChange={(e) => setBlogForm({ ...blogForm, read_time: e.target.value })} placeholder="5 daqiqa" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Muallif</Label>
                <Input value={blogForm.author} onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rang</Label>
                <Select value={blogForm.gradient} onValueChange={(value) => setBlogForm({ ...blogForm, gradient: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={blogForm.is_published} onCheckedChange={(checked) => setBlogForm({ ...blogForm, is_published: checked })} />
              <Label>Chop etish</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlogDialogOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleSavePost} disabled={savingPost}>
              {savingPost && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
