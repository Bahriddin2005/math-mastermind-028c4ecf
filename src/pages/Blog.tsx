import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <BookOpen className="h-3 w-3 mr-1" />
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Maqolalar va maslahatlar
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mental arifmetika bo'yicha foydali maqolalar, texnikalar va professional maslahatlar.
            </p>
          </div>

          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Maqolalarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 items-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
              <div className="ml-4">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'likes' | 'views')}>
                  <SelectTrigger className="w-[160px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Saralash" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Eng yangi</SelectItem>
                    <SelectItem value="likes">Eng ko'p yoqtirgan</SelectItem>
                    <SelectItem value="views">Eng ko'p ko'rilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Maqolalar topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const Icon = ICON_MAP[post.icon] || BookOpen;
                return (
                  <Card 
                    key={post.id} 
                    className="group border-border/40 shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer h-[380px] flex flex-col"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    <div className={`h-32 bg-gradient-to-br ${post.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-12 w-12 text-white/90" />
                    </div>
                    <CardHeader className="pb-2 flex-shrink-0">
                      <Badge variant="secondary" className="w-fit text-xs">{post.category}</Badge>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4 mt-auto flex-shrink-0">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{post.author}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.read_time}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views_count || 0}</span>
                        <BlogLikeButton postId={post.id} variant="compact" />
                      </div>
                      <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
