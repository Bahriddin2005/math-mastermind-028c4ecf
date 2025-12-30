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

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Platforma boshqaruvi</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Foydalanuvchilar</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalProblems.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Yechilgan</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalScore.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Jami ball</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalGames}</p>
                <p className="text-xs text-muted-foreground">O'yinlar</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.newUsersToday}</p>
                <p className="text-xs text-muted-foreground">Yangi bugun</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.activeToday}</p>
                <p className="text-xs text-muted-foreground">Faol bugun</p>
              </CardContent>
            </Card>
          </div>

          {/* Tez harakatlar (Quick Actions) */}
          <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Tez harakatlar
              </CardTitle>
              <CardDescription>Tez-tez ishlatiladigan amallar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:scale-105 transition-all duration-300 group"
                  onClick={() => openBlogDialog()}
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <PlusCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Yangi maqola</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 hover:scale-105 transition-all duration-300 group"
                  onClick={() => {
                    fetchUsers();
                    fetchStats();
                    toast.success("Ma'lumotlar yangilandi");
                  }}
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Yangilash</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/courses')}
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <GraduationCap className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Kurslarni ko'rish</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/blog')}
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                    <FileText className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Blogni ko'rish</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-105 transition-all duration-300 group relative"
                  onClick={() => {
                    const messagesTab = document.querySelector('[value="messages"]') as HTMLElement;
                    messagesTab?.click();
                  }}
                >
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                    <Mail className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Xabarlar</span>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 px-1.5 animate-pulse">{unreadCount}</Badge>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:scale-105 transition-all duration-300 group"
                  onClick={() => navigate('/settings')}
                >
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                    <Settings className="h-5 w-5 text-cyan-500" />
                  </div>
                  <span className="text-xs font-medium text-center">Sozlamalar</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="users" className="space-y-6">
            {/* Mobile: Card grid - 5 columns for better fit */}
            <div className="block md:hidden">
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { value: 'users', icon: Users, label: 'Foydalanuvchilar', color: 'blue', shortLabel: 'Users' },
                  { value: 'reports', icon: BarChart2, label: 'Hisobotlar', color: 'purple', shortLabel: 'Hisobot' },
                  { value: 'courses', icon: GraduationCap, label: 'Kurslar', color: 'emerald', shortLabel: 'Kurs' },
                  { value: 'files', icon: FolderOpen, label: 'Fayllar', color: 'amber', shortLabel: 'Fayl' },
                  { value: 'examples', icon: Calculator, label: 'Misollar', color: 'cyan', shortLabel: 'Misol' },
                  { value: 'faq', icon: HelpCircle, label: 'FAQ', color: 'indigo', shortLabel: 'FAQ' },
                  { value: 'testimonials', icon: Quote, label: 'Sharhlar', color: 'pink', shortLabel: 'Sharh' },
                  { value: 'chats', icon: MessageCircle, label: 'Chatlar', color: 'teal', shortLabel: 'Chat' },
                  { value: 'messages', icon: Mail, label: 'Xabarlar', color: 'red', shortLabel: 'Xabar', badge: unreadCount },
                  { value: 'blog', icon: FileText, label: 'Maqolalar', color: 'orange', shortLabel: 'Blog' },
                ].map((item) => (
                  <TabsList key={item.value} className="h-auto bg-transparent p-0">
                    <TabsTrigger 
                      value={item.value} 
                      className={`relative w-full flex flex-col items-center gap-1 p-2 h-auto rounded-xl 
                        bg-${item.color}-500/10 border border-${item.color}-500/20 
                        transition-all duration-300 hover:scale-[1.02] 
                        hover:bg-${item.color}-500/20 hover:border-${item.color}-500/40 
                        data-[state=active]:bg-gradient-to-br data-[state=active]:from-${item.color}-500 data-[state=active]:to-${item.color}-600 
                        data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-${item.color}-400
                        data-[state=active]:shadow-${item.color}-500/30`}
                    >
                      <div className={`h-8 w-8 rounded-lg bg-${item.color}-500/20 flex items-center justify-center 
                        data-[state=active]:bg-white/20 transition-colors`}>
                        <item.icon className={`h-4 w-4 text-${item.color}-500`} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight text-center">{item.shortLabel}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] animate-pulse">
                          {item.badge}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                ))}
              </div>
            </div>

            {/* Desktop: Beautiful horizontal navigation */}
            <div className="hidden md:block">
              <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
                <TabsList className="relative grid w-full grid-cols-10 h-14 gap-0.5 bg-transparent p-1.5">
                  {[
                    { value: 'users', icon: Users, label: 'Foydalanuvchilar', color: 'blue' },
                    { value: 'reports', icon: BarChart2, label: 'Hisobotlar', color: 'purple' },
                    { value: 'courses', icon: GraduationCap, label: 'Kurslar', color: 'emerald' },
                    { value: 'files', icon: FolderOpen, label: 'Fayllar', color: 'amber' },
                    { value: 'examples', icon: Calculator, label: 'Misollar', color: 'cyan' },
                    { value: 'faq', icon: HelpCircle, label: 'FAQ', color: 'indigo' },
                    { value: 'testimonials', icon: Quote, label: 'Sharhlar', color: 'pink' },
                    { value: 'chats', icon: MessageCircle, label: 'Chatlar', color: 'teal' },
                    { value: 'messages', icon: Mail, label: 'Xabarlar', color: 'red', badge: unreadCount },
                    { value: 'blog', icon: FileText, label: 'Maqolalar', color: 'orange' },
                  ].map((item) => (
                    <TabsTrigger 
                      key={item.value}
                      value={item.value} 
                      className={`relative group flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg
                        transition-all duration-300 
                        hover:bg-${item.color}-500/15 hover:-translate-y-0.5
                        data-[state=active]:bg-gradient-to-br data-[state=active]:from-${item.color}-500 data-[state=active]:to-${item.color}-600 
                        data-[state=active]:text-white data-[state=active]:shadow-lg
                        data-[state=active]:shadow-${item.color}-500/40`}
                    >
                      <div className={`h-6 w-6 rounded-md bg-${item.color}-500/20 flex items-center justify-center 
                        group-hover:bg-${item.color}-500/30 group-data-[state=active]:bg-white/20 transition-all duration-300`}>
                        <item.icon className={`h-3.5 w-3.5 text-${item.color}-500 group-data-[state=active]:text-white transition-colors`} />
                      </div>
                      <span className="text-[10px] font-medium leading-tight truncate max-w-full">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] animate-pulse">
                          {item.badge}
                        </Badge>
                      )}
                      {/* Active indicator */}
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full 
                        bg-${item.color}-500 opacity-0 data-[state=active]:opacity-100 transition-opacity`} />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Card>
            </div>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Statistics Charts */}
              <AdminUserCharts users={users} gameSessions={gameSessions} />

              <Card>
                <CardHeader>
                  <CardTitle>Foydalanuvchilar ro'yxati</CardTitle>
                  <CardDescription>Barcha ro'yxatdan o'tgan foydalanuvchilar</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((profile, index) => (
                        <div key={profile.id} className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-muted-foreground w-8">#{index + 1}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{profile.username}</p>
                                {adminUsers.includes(profile.user_id) && (
                                  <Badge variant="default" className="text-xs">Admin</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {profile.total_problems_solved} masala · {profile.best_streak} seriya
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">{profile.total_score.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(profile.created_at).split(',')[0]}</p>
                            </div>
                            {profile.user_id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAdminRole(profile.user_id)}
                              >
                                {adminUsers.includes(profile.user_id) ? (
                                  <><X className="h-4 w-4 mr-1" />Admin o'chirish</>
                                ) : (
                                  <><ShieldCheck className="h-4 w-4 mr-1" />Admin qilish</>
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
              <Card>
                <CardContent className="p-6">
                  <CourseManager isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <Card>
                <CardContent className="p-6">
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
              <Card>
                <CardHeader>
                  <CardTitle>Kontakt xabarlari</CardTitle>
                  <CardDescription>Foydalanuvchilardan kelgan xabarlar</CardDescription>
                </CardHeader>
                <CardContent>
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
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${message.is_read ? 'bg-secondary/30' : 'bg-primary/5 border-primary/20'}`}
                          onClick={() => handleViewMessage(message)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {!message.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                                <span className="font-semibold">{message.name}</span>
                                <span className="text-sm text-muted-foreground">({message.email})</span>
                              </div>
                              <p className="font-medium text-sm">{message.subject}</p>
                              <p className="text-sm text-muted-foreground truncate">{message.message}</p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(message.created_at)}</div>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Blog maqolalari</CardTitle>
                    <CardDescription>Maqolalarni yaratish va tahrirlash</CardDescription>
                  </div>
                  <Button onClick={() => openBlogDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yangi maqola
                  </Button>
                </CardHeader>
                <CardContent>
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
                    <div className="space-y-3">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="p-4 rounded-xl border bg-secondary/30 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{post.title}</span>
                              <Badge variant={post.is_published ? 'default' : 'secondary'}>
                                {post.is_published ? 'Chop etilgan' : 'Qoralama'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                              <Badge variant="outline">{post.category}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => togglePostPublish(post)}>
                              {post.is_published ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openBlogDialog(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
