import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  CheckCircle2,
  Loader2,
  User,
  Trash2
} from 'lucide-react';

interface Question {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  is_answered: boolean;
  created_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Question[];
}

interface LessonQAProps {
  lessonId: string;
}

export const LessonQA = ({ lessonId }: LessonQAProps) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('lesson_questions')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch profiles for all users
      const userIds = [...new Set(data.map(q => q.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      // Build question tree
      const questionMap = new Map<string, Question>();
      const rootQuestions: Question[] = [];

      data.forEach(q => {
        const question: Question = {
          ...q,
          profile: profileMap.get(q.user_id),
          replies: []
        };
        questionMap.set(q.id, question);
      });

      data.forEach(q => {
        const question = questionMap.get(q.id)!;
        if (q.parent_id) {
          const parent = questionMap.get(q.parent_id);
          if (parent) {
            parent.replies!.push(question);
          }
        } else {
          rootQuestions.push(question);
        }
      });

      setQuestions(rootQuestions);
    }
    setLoading(false);
  };

  const handleSubmitQuestion = async () => {
    if (!user || !newQuestion.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('lesson_questions')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: newQuestion.trim()
      });

    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success('Savol yuborildi');
      setNewQuestion('');
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('lesson_questions')
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId
      });

    if (error) {
      toast.error('Xatolik yuz berdi');
    } else {
      toast.success('Javob yuborildi');
      setReplyContent('');
      setReplyTo(null);
      fetchQuestions();
    }
    setSubmitting(false);
  };

  const handleDelete = async (questionId: string) => {
    const { error } = await supabase
      .from('lesson_questions')
      .delete()
      .eq('id', questionId);

    if (!error) {
      toast.success("O'chirildi");
      fetchQuestions();
    }
  };

  const QuestionItem = ({ question, isReply = false }: { question: Question; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : ''}`}>
      <Card className={`${isReply ? 'bg-muted/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={question.profile?.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {question.profile?.username || 'Foydalanuvchi'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(question.created_at), { addSuffix: true, locale: uz })}
                </span>
                {question.is_answered && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Javob berilgan
                  </Badge>
                )}
              </div>

              <p className="text-sm whitespace-pre-wrap">{question.content}</p>

              <div className="flex items-center gap-2 mt-2">
                {!isReply && user && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setReplyTo(replyTo === question.id ? null : question.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Javob
                  </Button>
                )}
                {user?.id === question.user_id && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(question.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Reply Form */}
              {replyTo === question.id && user && (
                <div className="mt-3 flex gap-2">
                  <Textarea
                    placeholder="Javobingizni yozing..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button 
                    onClick={() => handleSubmitReply(question.id)}
                    disabled={submitting || !replyContent.trim()}
                    size="sm"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {question.replies && question.replies.length > 0 && (
        <div className="space-y-2">
          {question.replies.map(reply => (
            <QuestionItem key={reply.id} question={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Savol-javoblar</h3>
        <Badge variant="secondary">{questions.length}</Badge>
      </div>

      {/* New Question Form */}
      {user ? (
        <Card>
          <CardContent className="p-4">
            <Textarea
              placeholder="Savolingizni yozing..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="min-h-[80px] mb-3"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitQuestion}
                disabled={submitting || !newQuestion.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Yuborish
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">Savol berish uchun tizimga kiring</p>
            <Button variant="outline" onClick={() => window.location.href = '/auth'}>
              Kirish
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Hali savollar yo'q</p>
            <p className="text-sm">Birinchi bo'lib savol bering!</p>
          </div>
        ) : (
          questions.map(question => (
            <QuestionItem key={question.id} question={question} />
          ))
        )}
      </div>
    </div>
  );
};