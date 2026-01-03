import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { BlogLikeButton } from '@/components/BlogLikeButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowRight,
  Search,
  Brain,
  Lightbulb,
  Eye,
  ArrowUpDown,
  Heart,
  Target,
  TrendingUp,
  Calculator,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  views_count: number | null;
  category: string;
  author: string;
  created_at: string;
  read_time: string;
  icon: string;
  gradient: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Calculator, Lightbulb, Target, TrendingUp, Sparkles, BookOpen
};

const categories = ["Barchasi", "Boshlang'ich", "Texnikalar", "Mashqlar", "Maslahatlar", "Dasturlar", "Bolalar uchun"];

const Blog = () => {
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'views'>('newest');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchLikeCounts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const fetchLikeCounts = async () => {
    const { data } = await supabase
      .from('blog_likes')
      .select('post_id');
    
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(like => {
        counts[like.post_id] = (counts[like.post_id] || 0) + 1;
      });
      setLikeCounts(counts);
    }
  };

  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Barchasi' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'likes') {
        return (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);
      } else if (sortBy === 'views') {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      return 0;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section - Dark Mode & Mobile optimized */}
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="mb-3 sm:mb-4 bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 dark:border-primary/30">
              <BookOpen className="h-3 w-3 mr-1" />
              Blog
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Maqolalar va maslahatlar
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Mental arifmetika bo'yicha foydali maqolalar, texnikalar va professional maslahatlar.
            </p>
          </div>

          {/* Search & Filter - Mobile optimized */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Maqolalarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 sm:h-10 bg-background dark:bg-card/80 border-border/50 dark:border-border/30"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 items-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 touch-target ${
                    selectedCategory === category 
                      ? 'shadow-lg shadow-primary/20 dark:shadow-primary/40' 
                      : 'bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/30 hover:bg-secondary dark:hover:bg-secondary/80'
                  }`}
                >
                  {category}
                </Button>
              ))}
              <div className="ml-2 sm:ml-4">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'likes' | 'views')}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-8 sm:h-9 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/30">
                    <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <SelectValue placeholder="Saralash" />
                  </SelectTrigger>
                  <SelectContent className="bg-card dark:bg-card/95 border-border/50 dark:border-border/30">
                    <SelectItem value="newest">Eng yangi</SelectItem>
                    <SelectItem value="likes">Eng ko'p yoqtirgan</SelectItem>
                    <SelectItem value="views">Eng ko'p ko'rilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <div className="text-center">
                <div className="relative">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
                </div>
                <p className="text-muted-foreground mt-4 text-sm sm:text-base">Yuklanmoqda...</p>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 flex items-center justify-center mx-auto mb-4 shadow-lg dark:shadow-primary/10">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">Maqolalar topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {filteredPosts.map((post, index) => {
                const Icon = ICON_MAP[post.icon] || BookOpen;
                return (
                  <Card 
                    key={post.id} 
                    className="group border-border/40 dark:border-border/20 shadow-lg hover:shadow-xl dark:shadow-xl dark:hover:shadow-2xl dark:shadow-primary/5 transition-all overflow-hidden cursor-pointer h-[340px] sm:h-[360px] lg:h-[380px] flex flex-col bg-card/80 dark:bg-card/90 backdrop-blur-sm hover:-translate-y-1 opacity-0 animate-slide-up dark:hover:border-primary/30"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    <div className={`h-28 sm:h-32 bg-gradient-to-br ${post.gradient} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute top-2 right-2 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute bottom-2 left-2 h-12 w-12 rounded-full bg-white/5 blur-xl" />
                      <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-white/90 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <CardHeader className="pb-2 flex-shrink-0 px-3 sm:px-6 pt-3 sm:pt-4">
                      <Badge variant="secondary" className="w-fit text-xs bg-secondary/80 dark:bg-secondary/60 border border-border/30">{post.category}</Badge>
                      <CardTitle className="text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors mt-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 px-3 sm:px-6">
                      <CardDescription className="line-clamp-2 sm:line-clamp-3 text-sm">{post.excerpt}</CardDescription>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground border-t border-border/30 dark:border-border/20 pt-3 sm:pt-4 mt-auto flex-shrink-0 px-3 sm:px-6 pb-3 sm:pb-4">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <span className="flex items-center gap-1"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{post.author}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{post.read_time}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{post.views_count || 0}</span>
                        <BlogLikeButton postId={post.id} variant="compact" />
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default Blog;
