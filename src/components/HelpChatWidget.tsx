import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
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
  ArrowLeft,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ImagePlus,
  XCircle,
  FileText,
  Copy,
  Check,
  Trash2,
  History,
  Plus
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
  audioUrl?: string;
  fileName?: string;
  timestamp: Date;
}

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const HelpChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<FAQItem | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ session_id: string; created_at: string; preview: string }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // AI Chat state
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Faqat bosh sahifada ko'rsatish
  if (location.pathname !== '/') {
    return null;
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Nusxalandi!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Nusxalashda xatolik");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Bugun";
    if (date.toDateString() === yesterday.toDateString()) return "Kecha";
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingHistory(false);
        return;
      }

      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('session_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessions && sessions.length > 0) {
        const historyWithPreview = await Promise.all(
          sessions.map(async (session) => {
            const { data: firstMsg } = await supabase
              .from('chat_messages')
              .select('content')
              .eq('session_id', session.session_id)
              .eq('role', 'user')
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            
            return {
              session_id: session.session_id,
              created_at: session.created_at,
              preview: firstMsg?.content?.substring(0, 50) || "Yangi suhbat"
            };
          })
        );
        setChatHistory(historyWithPreview);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
    setLoadingHistory(false);
  };

  const loadChatSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messages) {
        setMessages(messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
        sessionIdRef.current = sessionId;
        setShowHistory(false);
        setChatMode(true);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error("Suhbatni yuklashda xatolik");
    }
    setIsLoading(false);
  };

  const deleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
    toast.success("Xabar o'chirildi");
  };

  const startNewChat = () => {
    sessionIdRef.current = generateSessionId();
    setMessages([]);
    setShowHistory(false);
    setChatMode(true);
    startChatMode();
  };

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
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedPdf(null);
    setPdfFileName(null);
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    // Generate new session ID for next chat
    sessionIdRef.current = generateSessionId();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Faqat JPG, PNG yoki WebP formatlar qo'llab-quvvatlanadi");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage(base64);
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF hajmi 10MB dan oshmasligi kerak");
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error("Faqat PDF formatlar qo'llab-quvvatlanadi");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedPdf(base64);
      setPdfFileName(file.name);
    };
    reader.readAsDataURL(file);
    
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const clearPdf = () => {
    setSelectedPdf(null);
    setPdfFileName(null);
  };

  const playTTS = async (text: string) => {
    if (!ttsEnabled) return;
    
    try {
      setIsPlayingAudio(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop previous audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlayingAudio(false);
    }
  };

  const getSupportedMimeType = () => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceMessage(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      toast.success("Yozish boshlandi...");
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error("Mikrofonga ruxsat berilmadi");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process voice message - transcribe and send directly to AI, get voice response
  const processVoiceMessage = async (audioBlob: Blob) => {
    setIsVoiceProcessing(true);
    setIsLoading(true);
    
    try {
      // Step 1: Transcribe the audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const sttResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const sttData = await sttResponse.json();

      if (!sttResponse.ok || !sttData.text?.trim()) {
        throw new Error(sttData.error || "Ovoz aniqlanmadi");
      }

      const userText = sttData.text.trim();
      
      // Add user message (show as voice message)
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: `🎤 ${userText}`, 
        timestamp: new Date() 
      }]);
      await saveMessageToDb('user', `🎤 ${userText}`);

      // Step 2: Get AI response
      const faqContext = faqItems.map(f => `Savol: ${f.question}\nJavob: ${f.answer}`).join('\n\n');
      const coursesContext = courses.map(c => 
        `Kurs: ${c.title} (${c.difficulty} daraja)${c.description ? ` - ${c.description}` : ''}`
      ).join('\n');
      const lessonsContext = lessons.map(l => {
        const course = courses.find(c => c.id === l.course_id);
        return `Dars: ${l.title}${course ? ` (${course.title} kursidan)` : ''}`;
      }).join('\n');
      const userProgressContext = userProgress 
        ? `Foydalanuvchi: ${userProgress.username}, Jami ball: ${userProgress.total_score}, Yechilgan masalalar: ${userProgress.total_problems_solved}`
        : 'Foydalanuvchi tizimga kirmagan';

      const chatResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            message: userText,
            faqContext,
            coursesContext,
            lessonsContext,
            userProgressContext
          }),
        }
      );

      const chatData = await chatResponse.json();

      if (!chatResponse.ok) {
        throw new Error(chatData.error || 'AI javob bermadi');
      }

      const assistantMessage = chatData.response;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage, 
        timestamp: new Date() 
      }]);
      await saveMessageToDb('assistant', assistantMessage);

      // Step 3: Play TTS for AI response
      await playTTS(assistantMessage);

    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage = error instanceof Error ? error.message : "Ovozli xabar yuborishda xatolik";
      toast.error(errorMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Kechirasiz, ovozli xabaringizni qayta ishlab bo'lmadi. Iltimos, qaytadan urinib ko'ring.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsVoiceProcessing(false);
      setIsLoading(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.text && data.text.trim()) {
        setInputMessage(data.text);
      } else {
        toast.error("Ovoz aniqlanmadi, qaytadan urinib ko'ring");
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error("Ovozni aniqlashda xatolik");
    } finally {
      setIsLoading(false);
    }
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
    setMessages([{ role: 'assistant', content: welcomeMessage, timestamp: new Date() }]);
    
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
    if ((!inputMessage.trim() && !selectedImage && !selectedPdf) || isLoading) return;

    const userMessage = inputMessage.trim() || (selectedImage ? "Bu rasmni tahlil qiling" : selectedPdf ? "Bu PDF hujjatni tahlil qiling" : "");
    const imageToSend = selectedImage;
    const pdfToSend = selectedPdf;
    const pdfName = pdfFileName;
    
    setInputMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedPdf(null);
    setPdfFileName(null);
    
    // Show message with file indicator if file was attached
    let displayMessage = userMessage;
    if (imageToSend) {
      displayMessage = `${userMessage} [📷 Rasm biriktirildi]`;
    } else if (pdfToSend) {
      displayMessage = `${userMessage} [📄 ${pdfName}]`;
    }
    setMessages(prev => [...prev, { role: 'user', content: displayMessage, fileName: pdfName || undefined, timestamp: new Date() }]);
    setIsLoading(true);

    // Save user message to database
    await saveMessageToDb('user', displayMessage);

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
            userProgressContext,
            imageBase64: imageToSend,
            pdfBase64: pdfToSend,
            pdfFileName: pdfName
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }

      const assistantMessage = data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage, timestamp: new Date() }]);
      
      // Play TTS for assistant response
      playTTS(assistantMessage);
      
      // Save assistant message to database
      await saveMessageToDb('assistant', assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = "Kechirasiz, hozirda javob bera olmadim. Iltimos, keyinroq urinib ko'ring yoki /contact sahifasidan biz bilan bog'laning.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, timestamp: new Date() }]);
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
      {/* Floating Button - mobile da yuqoriroqda */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={`rounded-full h-12 w-12 md:h-14 md:w-14 shadow-lg hover:shadow-xl transition-all duration-300 ${
            isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>

      {/* Chat Widget - mobile responsive */}
      <div 
        className={`fixed z-50 transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        } bottom-24 md:bottom-6 right-2 md:right-6 left-2 md:left-auto`}
      >
        <Card className="w-full md:w-[400px] max-h-[70vh] md:max-h-none shadow-2xl border-border/50 overflow-hidden">
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

          <CardContent className="p-0 bg-background dark:bg-card">
            {chatMode ? (
              /* AI Chat Mode */
              <div className="flex flex-col h-[50vh] md:h-[400px]">
                {/* Back button, History and TTS toggle */}
                <div className="p-2 border-b border-border/50 bg-muted/30 dark:bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setChatMode(false);
                        setShowHistory(false);
                        setMessages([]);
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                        }
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Orqaga</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory) fetchChatHistory();
                      }}
                      title="Chat tarixi"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startNewChat}
                      title="Yangi suhbat"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTtsEnabled(!ttsEnabled)}
                      title={ttsEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
                      className={isPlayingAudio ? "text-primary animate-pulse" : "hover:text-foreground"}
                    >
                      {ttsEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Chat History Panel */}
                {showHistory && (
                  <div className="absolute inset-0 top-[52px] bg-background dark:bg-card z-10 flex flex-col">
                    <div className="p-3 border-b border-border/50">
                      <h3 className="font-semibold text-sm">Suhbat tarixi</h3>
                    </div>
                    <ScrollArea className="flex-1">
                      {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : chatHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Hali suhbatlar yo'q
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {chatHistory.map((session) => (
                            <button
                              key={session.session_id}
                              onClick={() => loadChatSession(session.session_id)}
                              className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate flex-1">
                                  {session.preview}...
                                </p>
                                <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                                  {formatDate(session.created_at)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20 dark:from-card dark:to-muted/10">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`group relative max-w-[85%]`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-md shadow-md'
                                : 'bg-muted dark:bg-muted/80 text-foreground rounded-bl-md shadow-sm border border-border/50'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {/* Action buttons */}
                          <div className={`absolute ${msg.role === 'user' ? '-left-16' : '-right-16'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                            {msg.role === 'assistant' && (
                              <button
                                onClick={() => copyToClipboard(msg.content, index)}
                                className="p-1.5 rounded-lg hover:bg-muted"
                                title="Nusxalash"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(index)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10"
                              title="O'chirish"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                        {/* Timestamp */}
                        <span className={`text-[10px] text-muted-foreground mt-1 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted dark:bg-muted/80 px-5 py-3 rounded-2xl rounded-bl-md shadow-sm border border-border/50">
                          <div className="flex items-center gap-1.5">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 pt-2">
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                      <button
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF Preview */}
                {pdfFileName && (
                  <div className="px-4 pt-2">
                    <div className="relative inline-flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm truncate max-w-[150px]">{pdfFileName}</span>
                      <button
                        onClick={clearPdf}
                        className="p-0.5 hover:bg-destructive/20 rounded-full"
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Recording Wave Animation */}
                {isRecording && (
                  <div className="px-4 py-3 border-t border-border/50 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
                    <div className="flex items-center justify-center gap-3">
                      <div className="voice-wave-container">
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                      </div>
                      <span className="text-sm font-medium text-primary animate-pulse">
                        Gapiring...
                      </span>
                      <div className="voice-wave-container">
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                        <div className="voice-wave-bar" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Processing Indicator */}
                {isVoiceProcessing && !isRecording && (
                  <div className="px-4 py-3 border-t border-border/50 bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Ovoz qayta ishlanmoqda...
                      </span>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border/50 bg-muted/30 dark:bg-muted/10">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isLoading || isRecording || !!selectedImage}
                      title="PDF yuklash"
                      className={isRecording ? "opacity-50" : ""}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isRecording || !!selectedPdf}
                      title="Rasm yuklash"
                      className={isRecording ? "opacity-50" : ""}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isVoiceProcessing}
                      title={isRecording ? "Yozishni to'xtatish va yuborish" : "Ovoz bilan so'rash"}
                      className={isRecording ? "animate-pulse ring-2 ring-destructive ring-offset-2" : ""}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isRecording ? "Mikrofon yoqilgan..." : isVoiceProcessing ? "Qayta ishlanmoqda..." : selectedImage ? "Rasm haqida so'rang..." : selectedPdf ? "PDF haqida so'rang..." : "Savolingizni yozing..."}
                      disabled={isLoading || isRecording || isVoiceProcessing}
                      className={`flex-1 ${isRecording ? "opacity-50" : ""}`}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={(!inputMessage.trim() && !selectedImage && !selectedPdf) || isLoading || isRecording || isVoiceProcessing}
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
