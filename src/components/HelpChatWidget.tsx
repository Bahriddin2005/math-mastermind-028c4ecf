import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Send, 
  HelpCircle,
  BookOpen,
  Calculator,
  GraduationCap,
  Trophy,
  Settings,
  ChevronRight,
  User,
  Target,
  Loader2,
  Bot,
  ArrowLeft
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
}

interface UserProgress {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  current_streak: number;
  daily_goal: number;
}

const iconMap: Record<string, React.ReactNode> = {
  HelpCircle: <HelpCircle className="h-4 w-4" />,
  Calculator: <Calculator className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Trophy: <Trophy className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const HelpChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  
  // AI Chat state
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(generateSessionId());

  useEffect(() => {
    fetchFAQs();
    fetchCoursesAndLessons();
    fetchUserProgress();
  }, []);

  const fetchFAQs = async () => {
    const { data } = await supabase
      .from('faq_items')
      .select('id, question, answer, icon')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
    
    if (data) {
      setFaqItems(data);
    }
    setLoadingFaqs(false);
  };

  const fetchCoursesAndLessons = async () => {
    const [coursesRes, lessonsRes] = await Promise.all([
      supabase.from('courses').select('id, title, description, difficulty').eq('is_published', true),
      supabase.from('lessons').select('id, title, course_id').eq('is_published', true)
    ]);
    
    if (coursesRes.data) setCourses(coursesRes.data);
    if (lessonsRes.data) setLessons(lessonsRes.data);
  };

  const fetchUserProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('username, total_score, total_problems_solved, best_streak, current_streak, daily_goal')
      .eq('user_id', user.id)
      .single();

    if (data) setUserProgress(data);
  };

  const filteredFaqs = faqItems.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFaq(null);
    setSearchQuery('');
    setChatMode(false);
    setMessages([]);
    setInputMessage('');
    // Generate new session ID for next chat
    sessionIdRef.current = generateSessionId();
  };

  const saveMessageToDb = async (role: 'user' | 'assistant', content: string) => {
    try {
      await supabase.from('chat_messages').insert({
        session_id: sessionIdRef.current,
        role,
        content
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const startChatMode = async () => {
    setChatMode(true);
    const welcomeMessage = "Salom! Men IQroMax yordamchisiman. Sizga qanday yordam bera olaman?";
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
    
    // Create session and save welcome message
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('chat_sessions').insert({
        session_id: sessionIdRef.current,
        user_id: user?.id || null
      });
      await saveMessageToDb('assistant', welcomeMessage);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Save user message to database
    await saveMessageToDb('user', userMessage);

    try {
      // Create FAQ context for AI
      const faqContext = faqItems.map(f => `Savol: ${f.question}\nJavob: ${f.answer}`).join('\n\n');
      
      // Create courses context
      const coursesContext = courses.map(c => 
        `Kurs: ${c.title} (${c.difficulty} daraja)${c.description ? ` - ${c.description}` : ''}`
      ).join('\n');
      
      // Create lessons context
      const lessonsContext = lessons.map(l => {
        const course = courses.find(c => c.id === l.course_id);
        return `Dars: ${l.title}${course ? ` (${course.title} kursidan)` : ''}`;
      }).join('\n');

      // Create user progress context
      const userProgressContext = userProgress 
        ? `Foydalanuvchi: ${userProgress.username}
Jami ball: ${userProgress.total_score}
Yechilgan masalalar: ${userProgress.total_problems_solved}
Eng yaxshi seriya: ${userProgress.best_streak}
Hozirgi seriya: ${userProgress.current_streak}
Kunlik maqsad: ${userProgress.daily_goal} masala`
        : 'Foydalanuvchi tizimga kirmagan';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            message: userMessage,
            faqContext,
            coursesContext,
            lessonsContext,
            userProgressContext
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }

      const assistantMessage = data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      
      // Save assistant message to database
      await saveMessageToDb('assistant', assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = "Kechirasiz, hozirda javob bera olmadim. Iltimos, keyinroq urinib ko'ring yoki /contact sahifasidan biz bilan bog'laning.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      await saveMessageToDb('assistant', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={`rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Widget */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Card className="w-[350px] sm:w-[400px] shadow-2xl border-border/50 overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-foreground/20 rounded-full">
                  {chatMode ? <Bot className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {chatMode ? "AI Yordamchi" : "Yordam markazi"}
                  </CardTitle>
                  <p className="text-sm text-primary-foreground/80">
                    {chatMode ? "Savolingizga javob beraman" : "Savolingiz bormi?"}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClose}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {chatMode ? (
              /* AI Chat Mode */
              <div className="flex flex-col h-[400px]">
                {/* Back button */}
                <div className="p-2 border-b">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setChatMode(false);
                      setMessages([]);
                    }}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    FAQ ga qaytish
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-secondary px-4 py-2 rounded-2xl rounded-bl-md">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Savolingizni yozing..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!inputMessage.trim() || isLoading}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedFaq ? (
              /* Answer View */
              <div className="p-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedFaq(null)}
                  className="mb-3 -ml-2 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Orqaga
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      {iconMap[selectedFaq.icon] || <HelpCircle className="h-4 w-4" />}
                    </div>
                    <h3 className="font-semibold text-lg">{selectedFaq.question}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-11">
                    {selectedFaq.answer}
                  </p>
                </div>
              </div>
            ) : (
              /* FAQ List View */
              <>
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Input
                      placeholder="Savol qidiring..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                    <Send className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* FAQ List */}
                <ScrollArea className="h-[250px]">
                  <div className="p-2">
                    {loadingFaqs ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredFaqs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Savol topilmadi</p>
                        <p className="text-sm">Boshqa so'z bilan qidirib ko'ring</p>
                      </div>
                    ) : (
                      filteredFaqs.map((faq) => (
                        <button
                          key={faq.id}
                          onClick={() => setSelectedFaq(faq)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                            {iconMap[faq.icon] || <HelpCircle className="h-4 w-4" />}
                          </div>
                          <span className="flex-1 font-medium text-sm">{faq.question}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Footer with AI Chat button */}
                <div className="p-4 border-t bg-secondary/30 space-y-3">
                  <Button 
                    onClick={startChatMode}
                    className="w-full gap-2"
                    variant="default"
                  >
                    <Bot className="h-4 w-4" />
                    AI bilan suhbatlashing
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Javob topmadingizmi?{' '}
                    <a href="/contact" className="text-primary hover:underline font-medium">
                      Bog'laning
                    </a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40 sm:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
};
