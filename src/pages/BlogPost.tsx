import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BlogComments } from '@/components/BlogComments';
import { BlogLikeButton } from '@/components/BlogLikeButton';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar,
  Eye,
  BookOpen,
  Brain,
  Calculator,
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
  Loader2
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
  read_time: string;
  icon: string;
  gradient: string;
  views_count: number | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Calculator, Lightbulb, Target, TrendingUp, Sparkles, BookOpen
};

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();

    if (data) {
      setPost(data);
      // Increment views count
      await supabase.rpc('increment_blog_views', { post_id: id });
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10">
        {/* Background decorations */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4 text-sm sm:text-base">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <PageBackground className="flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg dark:shadow-primary/10">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-2 sm:mb-3">Maqola topilmadi</h1>
            <p className="text-muted-foreground dark:text-muted-foreground/80 mb-5 sm:mb-6 text-sm sm:text-base">Bu maqola mavjud emas yoki o'chirilgan</p>
            <Button onClick={() => navigate('/blog')} size="lg" className="h-11 sm:h-12 text-sm sm:text-base touch-target">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Blogga qaytish
            </Button>
          </div>
        </main>
        <Footer />
      </PageBackground>
    );
  }

  const Icon = ICON_MAP[post.icon] || BookOpen;

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Header - Dark Mode & Mobile Enhanced */}
        <div className={`bg-gradient-to-br ${post.gradient} py-12 sm:py-16 md:py-24 relative overflow-hidden`}>
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          </div>
          
          <div className="container px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <Button 
                variant="ghost" 
                className="mb-4 sm:mb-6 text-white/80 hover:text-white hover:bg-white/10 h-10 text-sm sm:text-base"
                onClick={() => navigate('/blog')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Blogga qaytish</span>
                <span className="xs:hidden">Orqaga</span>
              </Button>
              
              <Badge className="mb-3 sm:mb-4 bg-white/20 text-white hover:bg-white/30 border-white/30 text-xs sm:text-sm">
                {post.category}
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold mb-4 sm:mb-6 leading-tight px-2">
                {post.title}
              </h1>
              
              <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 px-2 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-white/80 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {formatDate(post.created_at)}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {post.read_time}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {(post.views_count || 0) + 1} ko'rish
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Dark Mode Enhanced */}
        <div className="container px-4 py-8 sm:py-12">
          <article className="max-w-3xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-foreground/90 dark:text-foreground/85 leading-relaxed mb-5 sm:mb-6 text-base sm:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Like Button */}
            <div className="flex justify-center mt-6 sm:mt-8">
              <BlogLikeButton postId={post.id} />
            </div>

            {/* Comments Section */}
            <BlogComments postId={post.id} />

            {/* Share & Navigate - Mobile optimized */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-border/40 dark:border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <Button variant="outline" onClick={() => navigate('/blog')} className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base border-border/50 dark:border-border/30 dark:hover:bg-secondary/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Boshqa maqolalar
              </Button>
              
              <Button onClick={() => navigate('/train')} className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base shadow-lg dark:shadow-primary/30">
                Mashq qilish
              </Button>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default BlogPost;
