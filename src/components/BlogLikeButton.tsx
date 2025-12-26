import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BlogLikeButtonProps {
  postId: string;
  variant?: 'default' | 'compact';
}

export const BlogLikeButton = ({ postId, variant = 'default' }: BlogLikeButtonProps) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLikes();
  }, [postId, user]);

  const fetchLikes = async () => {
    // Get total likes count
    const { count } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    setLikesCount(count || 0);

    // Check if current user liked
    if (user) {
      const { data } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      setLiked(!!data);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.info("Yoqtirish uchun tizimga kiring");
      return;
    }

    setLoading(true);

    if (liked) {
      // Remove like
      const { error } = await supabase
        .from('blog_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (!error) {
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      // Add like
      const { error } = await supabase
        .from('blog_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (!error) {
        setLiked(true);
        setLikesCount(prev => prev + 1);
        toast.success("Maqola yoqdi!");
      }
    }

    setLoading(false);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLike();
        }}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          liked 
            ? "text-red-500" 
            : "text-muted-foreground hover:text-red-500"
        )}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        <span>{likesCount}</span>
      </button>
    );
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="lg"
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "gap-2 transition-all",
        liked && "bg-red-500 hover:bg-red-600 border-red-500"
      )}
    >
      <Heart className={cn("h-5 w-5", liked && "fill-current")} />
      <span>{likesCount} ta yoqdi</span>
    </Button>
  );
};
