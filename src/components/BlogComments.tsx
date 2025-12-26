import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Edit2, 
  Loader2,
  User as UserIcon,
  Reply,
  CornerDownRight
} from 'lucide-react';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface BlogCommentsProps {
  postId: string;
}

export const BlogComments = ({ postId }: BlogCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data: commentsData } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id)
      }));

      // Organize into parent comments with replies
      const parentComments = commentsWithProfiles.filter(c => !c.parent_id);
      const replies = commentsWithProfiles.filter(c => c.parent_id);
      
      const organizedComments = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(r => r.parent_id === parent.id)
      }));

      setComments(organizedComments);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim()
      });

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("Izoh qo'shildi");
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    const { error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId
      });

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("Javob qo'shildi");
      setReplyingTo(null);
      setReplyContent('');
      fetchComments();
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from('blog_comments')
      .update({ content: editContent.trim() })
      .eq('id', commentId);

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("Izoh yangilandi");
      setEditingId(null);
      setEditContent('');
      fetchComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("Izoh o'chirildi");
      fetchComments();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 p-4 bg-secondary/20 rounded-xl ${isReply ? 'ml-8 border-l-2 border-primary/20' : ''}`}>
      <Avatar className={`flex-shrink-0 ${isReply ? 'h-8 w-8' : 'h-10 w-10'}`}>
        <AvatarImage src={comment.profile?.avatar_url || ''} />
        <AvatarFallback className="bg-primary/10 text-primary">
          <UserIcon className={isReply ? 'h-4 w-4' : 'h-5 w-5'} />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            {isReply && <CornerDownRight className="h-3 w-3 text-muted-foreground" />}
            <span className={`font-medium text-foreground ${isReply ? 'text-sm' : ''}`}>
              {comment.profile?.username || 'Foydalanuvchi'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
          </span>
        </div>
        
        {editingId === comment.id ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleEdit(comment.id)}>
                Saqlash
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setEditContent('');
                }}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        ) : (
          <p className={`text-foreground/80 whitespace-pre-wrap ${isReply ? 'text-sm' : ''}`}>
            {comment.content}
          </p>
        )}
        
        {editingId !== comment.id && (
          <div className="flex gap-2 mt-2">
            {user && !isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-primary text-xs"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent('');
                }}
              >
                <Reply className="h-3 w-3 mr-1" />
                Javob berish
              </Button>
            )}
            {user?.id === comment.user_id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Tahrirlash
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive text-xs"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  O'chirish
                </Button>
              </>
            )}
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2 p-3 bg-background/50 rounded-lg">
            <Textarea
              placeholder="Javobingizni yozing..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyContent.trim()}>
                <Send className="h-3 w-3 mr-1" />
                Yuborish
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="mt-8 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Izohlar ({totalComments})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Izohingizni yozing..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Yuborish
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 bg-secondary/30 rounded-xl">
            <p className="text-muted-foreground">
              Izoh qoldirish uchun tizimga kiring
            </p>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Hali izohlar yo'q</p>
            <p className="text-sm text-muted-foreground">Birinchi izohni qoldiring!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <CommentItem comment={comment} />
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-2">
                    {comment.replies.map((reply) => (
                      <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
