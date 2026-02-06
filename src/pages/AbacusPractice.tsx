import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Play, RotateCcw, Check, Trophy, Clock, Target, Minus, Plus, Monitor, Smartphone, Maximize2, Volume2, VolumeX, Settings2, Zap, ChevronRight, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { InteractiveAbacus } from '@/components/InteractiveAbacus';
import { 
  RealisticAbacus, 
  AbacusModeSelector,
  FullscreenAbacus,
  type AbacusMode,
  type AbacusOrientation,
} from '@/components/abacus';
import { generateProblem, type GeneratedProblem, type FormulaCategory } from '@/lib/sorobanEngine';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PracticeSettings {
  digitCount: number;
  termCount: number;
  formulaType: FormulaCategory;
  problemCount: number;
}

interface SessionStats {
  totalTime: number;
  correctAnswers: number;
  problems: { time: number; correct: boolean }[];
}

// Settings config for DRY rendering
const DIGIT_OPTIONS = [
  { value: '1', label: '1 xonali' },
  { value: '2', label: '2 xonali' },
  { value: '3', label: '3 xonali' },
];
const TERM_OPTIONS = [
  { value: '3', label: '3 ta had' },
  { value: '5', label: '5 ta had' },
  { value: '7', label: '7 ta had' },
  { value: '10', label: '10 ta had' },
];
const FORMULA_OPTIONS = [
  { value: 'formulasiz', label: 'Formulasiz' },
  { value: 'kichik_dost', label: "Kichik do'st (5)" },
  { value: 'katta_dost', label: "Katta do'st (10)" },
  { value: 'mix', label: 'Aralash' },
];
const PROBLEM_COUNT_OPTIONS = [
  { value: '5', label: '5 ta' },
  { value: '10', label: '10 ta' },
  { value: '15', label: '15 ta' },
  { value: '20', label: '20 ta' },
];

const AbacusPractice = () => {
  const { user } = useAuth();
  const { playSound, soundEnabled, toggleSound } = useSound();
  const isMobile = useIsMobile();
  
  const [abacusColumns, setAbacusColumns] = useState(5);
  const [abacusMode, setAbacusMode] = useState<AbacusMode>('beginner');
  const [abacusOrientation, setAbacusOrientation] = useState<AbacusOrientation>('horizontal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAbacusSettings, setShowAbacusSettings] = useState(false);
  
  const [settings, setSettings] = useState<PracticeSettings>({
    digitCount: 1,
    termCount: 5,
    formulaType: 'formulasiz',
    problemCount: 10,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'answer' | 'results'>('idle');
  const [currentProblem, setCurrentProblem] = useState<GeneratedProblem | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [abacusValue, setAbacusValue] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTime: 0,
    correctAnswers: 0,
    problems: [],
  });
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'answer') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - problemStartTime);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, problemStartTime]);

  const generateNewProblem = useCallback(() => {
    const allowedFormulas: FormulaCategory[] = settings.formulaType === 'mix' 
      ? ['formulasiz', 'kichik_dost', 'katta_dost']
      : [settings.formulaType];
    
    const problem = generateProblem({
      digitCount: settings.digitCount,
      operationCount: settings.termCount,
      allowedFormulas,
      ensurePositiveResult: true,
    });
    setCurrentProblem(problem);
    setCurrentStep(0);
    setAbacusValue(problem.startValue);
    setProblemStartTime(Date.now());
    setElapsedTime(0);
    setGameState('playing');
  }, [settings]);

  const startGame = () => {
    setProblemIndex(0);
    setSessionStats({ totalTime: 0, correctAnswers: 0, problems: [] });
    generateNewProblem();
  };

  // Check abacus value
  useEffect(() => {
    if (gameState !== 'playing' || !currentProblem) return;
    
    const expectedValue = currentProblem.startValue + currentProblem.sequence
      .slice(0, currentStep + 1)
      .reduce((sum, val) => sum + val, 0);
    
    if (abacusValue === expectedValue) {
      playSound('correct');
      if (currentStep < currentProblem.sequence.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      } else {
        setTimeout(() => setGameState('answer'), 500);
      }
    }
  }, [abacusValue, currentStep, currentProblem, gameState, playSound]);

  const checkAnswer = () => {
    if (!currentProblem) return;
    const isCorrect = parseInt(userAnswer) === currentProblem.finalAnswer;
    const problemTime = Date.now() - problemStartTime;
    
    if (isCorrect) {
      playSound('levelUp');
      toast.success("To'g'ri! 🎉");
    } else {
      playSound('incorrect');
      toast.error(`Noto'g'ri. Javob: ${currentProblem.finalAnswer}`);
    }
    
    setSessionStats(prev => ({
      totalTime: prev.totalTime + problemTime,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      problems: [...prev.problems, { time: problemTime, correct: isCorrect }],
    }));
    
    const nextIndex = problemIndex + 1;
    if (nextIndex < settings.problemCount) {
      setProblemIndex(nextIndex);
      setUserAnswer('');
      generateNewProblem();
    } else {
      setGameState('results');
      saveSession();
    }
  };

  const saveSession = async () => {
    if (!user) return;
    try {
      await supabase.from('game_sessions').insert({
        user_id: user.id,
        section: 'abacus-practice',
        mode: 'interactive',
        difficulty: `${settings.digitCount}-digit-${settings.termCount}terms`,
        formula_type: settings.formulaType,
        correct: sessionStats.correctAnswers + (parseInt(userAnswer) === currentProblem?.finalAnswer ? 1 : 0),
        incorrect: settings.problemCount - sessionStats.correctAnswers - (parseInt(userAnswer) === currentProblem?.finalAnswer ? 1 : 0),
        total_time: (sessionStats.totalTime + (Date.now() - problemStartTime)) / 1000,
        problems_solved: settings.problemCount,
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const currentOperation = currentProblem?.sequence[currentStep];
  const expectedValue = currentProblem 
    ? currentProblem.startValue + currentProblem.sequence
        .slice(0, currentStep + 1)
        .reduce((sum, val) => sum + val, 0)
    : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const accuracy = settings.problemCount > 0 
    ? Math.round((sessionStats.correctAnswers / settings.problemCount) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/abacus-simulator" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2">
            {gameState !== 'idle' && gameState !== 'results' && (
              <>
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  {problemIndex + 1}/{settings.problemCount}
                </div>
                <div className="flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-sm font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatTime(elapsedTime)}
                </div>
              </>
            )}
          </div>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full w-9 h-9 p-0">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Sozlamalar
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <SettingsSelect
                  label="Xonalar soni"
                  value={settings.digitCount.toString()}
                  onChange={(v) => setSettings(prev => ({ ...prev, digitCount: parseInt(v) }))}
                  options={DIGIT_OPTIONS}
                />
                <SettingsSelect
                  label="Hadlar soni"
                  value={settings.termCount.toString()}
                  onChange={(v) => setSettings(prev => ({ ...prev, termCount: parseInt(v) }))}
                  options={TERM_OPTIONS}
                />
                <SettingsSelect
                  label="Formula turi"
                  value={settings.formulaType}
                  onChange={(v) => setSettings(prev => ({ ...prev, formulaType: v as FormulaCategory }))}
                  options={FORMULA_OPTIONS}
                />
                <SettingsSelect
                  label="Misollar soni"
                  value={settings.problemCount.toString()}
                  onChange={(v) => setSettings(prev => ({ ...prev, problemCount: parseInt(v) }))}
                  options={PROBLEM_COUNT_OPTIONS}
                />
                <Button className="w-full rounded-xl h-11" onClick={() => setSettingsOpen(false)}>
                  Saqlash
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Fullscreen Abacus Modal */}
      <FullscreenAbacus
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        initialColumns={abacusColumns}
        initialValue={abacusValue}
        initialMode={abacusMode}
      />

      <main className="container mx-auto px-4 py-5 pb-24 max-w-4xl">
        <AnimatePresence mode="wait">
          {/* ===== IDLE SCREEN ===== */}
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Hero Card */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary via-primary to-primary-foreground/10 relative">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <CardContent className="pt-8 pb-8 text-center relative z-10">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-6xl mb-4"
                    >
                      🧮
                    </motion.div>
                    <h1 className="text-2xl font-bold text-primary-foreground mb-1.5">
                      Abakus Amaliyot
                    </h1>
                    <p className="text-primary-foreground/70 text-sm max-w-xs mx-auto">
                      Misollarni abakusda ishlang va tez hisoblashni o'rganing
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Abacus Settings */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border border-border/60 shadow-md">
                  <CardContent className="pt-5 pb-5 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings2 className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="font-semibold text-base">Abakus Sozlamalari</h2>
                    </div>
                    
                    {/* Mode selector */}
                    <AbacusModeSelector mode={abacusMode} onChange={setAbacusMode} compact />
                    
                    {/* Columns */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">Ustunlar soni</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAbacusColumns(prev => Math.max(3, prev - 1))}
                          disabled={abacusColumns <= 3}
                          className="w-8 h-8 p-0 rounded-lg"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-lg">{abacusColumns}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAbacusColumns(prev => Math.min(17, prev + 1))}
                          disabled={abacusColumns >= 17}
                          className="w-8 h-8 p-0 rounded-lg"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Orientation */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">Yo'nalish</span>
                      <div className="flex items-center gap-1 bg-background rounded-lg p-1 border border-border/50">
                        <Button
                          variant={abacusOrientation === 'horizontal' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAbacusOrientation('horizontal')}
                          className="h-8 px-3 gap-1.5 rounded-md"
                        >
                          <Monitor className="w-4 h-4" />
                          <span className="hidden sm:inline text-xs">Gorizontal</span>
                        </Button>
                        <Button
                          variant={abacusOrientation === 'vertical' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setAbacusOrientation('vertical')}
                          className="h-8 px-3 gap-1.5 rounded-md"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span className="hidden sm:inline text-xs">Vertikal</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Fullscreen button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFullscreen(true)}
                      className="w-full gap-2 h-10 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Fullscreen Rejim
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Current settings summary */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border border-border/60 shadow-md">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <h2 className="font-semibold text-base">Joriy Sozlamalar</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SettingChip label="Xonalar" value={`${settings.digitCount} xonali`} />
                      <SettingChip label="Hadlar" value={`${settings.termCount} ta`} />
                      <SettingChip label="Formula" value={settings.formulaType.replace('_', ' ')} />
                      <SettingChip label="Misollar" value={`${settings.problemCount} ta`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Start button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  size="lg" 
                  className="w-full text-lg py-7 gap-3 rounded-2xl shadow-lg shadow-primary/25 relative overflow-hidden group"
                  onClick={startGame}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Play className="w-6 h-6" />
                  Boshlash
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ===== PLAYING SCREEN ===== */}
          {(gameState === 'playing' || gameState === 'answer') && currentProblem && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Quick actions bar */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="gap-1.5 h-8 px-3 rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Fullscreen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </Button>
              </div>
              
              <div className={cn("flex gap-4", isMobile ? "flex-col" : "flex-row items-start")}>
                {/* Abacus */}
                <div className={cn(
                  "flex justify-center items-start overflow-hidden min-w-0",
                  isMobile ? "order-1 w-full max-h-[52vh]" : "flex-1 max-h-[72vh]"
                )}>
                  <div className="scale-[0.95] origin-top">
                    <RealisticAbacus
                      columns={abacusColumns}
                      value={abacusValue}
                      onChange={setAbacusValue}
                      mode={abacusMode}
                      showValue={abacusMode !== 'mental'}
                      orientation={abacusOrientation}
                      readOnly={gameState === 'answer'}
                    />
                  </div>
                </div>
              
                {/* Operations panel */}
                <div className={cn("space-y-3", isMobile ? "order-2 w-full" : "w-72 flex-shrink-0")}>
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Misol {problemIndex + 1}/{settings.problemCount}</span>
                      <span className="font-mono text-muted-foreground">{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(problemIndex / settings.problemCount) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                      />
                    </div>
                  </div>
                  
                  {gameState === 'playing' && (
                    <>
                      {/* Start value + Current operation combined */}
                      <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
                        <CardContent className="py-3 px-4 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Boshlang'ich: <strong className="text-accent-foreground">{currentProblem.startValue}</strong></span>
                            <span className="text-muted-foreground">Qadam {currentStep + 1}/{currentProblem.sequence.length}</span>
                          </div>
                          <motion.div
                            key={currentStep}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <div className="text-4xl font-bold text-primary">
                              {currentOperation && currentOperation >= 0 ? '+' : ''}{currentOperation}
                            </div>
                          </motion.div>
                          <div className="text-[10px] text-muted-foreground/60 text-center flex items-center justify-center gap-1">
                            <Target className="w-3 h-3" />
                            Kutilayotgan: {expectedValue}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Upcoming operations */}
                      {currentStep < currentProblem.sequence.length - 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[10px] text-muted-foreground mr-1 self-center">Keyingi:</span>
                          {currentProblem.sequence.slice(currentStep + 1, currentStep + 4).map((op, i) => (
                            <span 
                              key={i}
                              className="px-2 py-1 bg-muted/80 rounded-md text-xs font-mono font-medium border border-border/30"
                            >
                              {op >= 0 ? '+' : ''}{op}
                            </span>
                          ))}
                          {currentProblem.sequence.length - currentStep - 1 > 3 && (
                            <span className="text-muted-foreground text-xs self-center">…</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {gameState === 'answer' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5 shadow-sm">
                        <CardContent className="py-4 px-4 space-y-3">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-accent-foreground mb-2 flex items-center justify-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Javobni kiriting
                            </div>
                            <Input
                              type="number"
                              value={userAnswer}
                              onChange={(e) => setUserAnswer(e.target.value)}
                              className="text-center text-2xl font-bold h-12 rounded-xl border-2 border-accent/30 focus:border-accent"
                              placeholder="?"
                              autoFocus
                            />
                          </div>
                          <Button 
                            className="w-full gap-2 h-10 rounded-xl"
                            onClick={checkAnswer}
                            disabled={!userAnswer}
                          >
                            <Check className="w-4 h-4" />
                            Tekshirish
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== RESULTS SCREEN ===== */}
          {gameState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              {/* Results hero */}
              <Card className="overflow-hidden border-0 shadow-xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
                
                <CardContent className="pt-8 pb-8 text-center relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : '💪'}
                  </motion.div>
                  <h1 className="text-2xl font-bold text-primary-foreground mb-1">
                    Sessiya tugadi!
                  </h1>
                  <p className="text-primary-foreground/70 text-sm">
                    {accuracy >= 80 ? "Ajoyib natija!" : accuracy >= 50 ? "Yaxshi harakat!" : "Davom eting!"}
                  </p>
                </CardContent>
              </Card>
              
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <ResultStatCard
                  icon={<Target className="w-5 h-5 text-primary" />}
                  value={`${sessionStats.correctAnswers}/${settings.problemCount}`}
                  label="To'g'ri"
                  delay={0.3}
                />
                <ResultStatCard
                  icon={<Clock className="w-5 h-5 text-info" />}
                  value={formatTime(sessionStats.totalTime)}
                  label="Umumiy vaqt"
                  delay={0.4}
                />
                <ResultStatCard
                  icon={<Star className="w-5 h-5 text-accent" />}
                  value={`${accuracy}%`}
                  label="Aniqlik"
                  delay={0.5}
                />
              </div>

              {/* Problem breakdown */}
              {sessionStats.problems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="border border-border/60 shadow-md">
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Natijalar tafsiloti</h3>
                      <div className="flex gap-1.5 flex-wrap">
                        {sessionStats.problems.map((p, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                              p.correct 
                                ? "bg-primary/15 text-primary border border-primary/20" 
                                : "bg-destructive/15 text-destructive border border-destructive/20"
                            )}
                          >
                            {i + 1}
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              
              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-3"
              >
                <Button 
                  variant="outline"
                  className="flex-1 gap-2 h-12 rounded-xl"
                  onClick={() => setGameState('idle')}
                >
                  <Settings className="w-5 h-5" />
                  Sozlamalar
                </Button>
                <Button 
                  className="flex-1 gap-2 h-12 rounded-xl shadow-md shadow-primary/20"
                  onClick={startGame}
                >
                  <RotateCcw className="w-5 h-5" />
                  Qayta boshlash
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// ===== Sub-components =====

const SettingsSelect = ({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-muted-foreground">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const SettingChip = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/60 rounded-xl px-4 py-2.5 border border-border/30">
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
    <div className="text-sm font-semibold capitalize mt-0.5">{value}</div>
  </div>
);

const ResultStatCard = ({ icon, value, label, delay }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="border border-border/60 shadow-md">
      <CardContent className="pt-4 pb-4 text-center">
                  <div className="flex justify-center mb-2">{icon}</div>
                  <div className="text-xl font-bold text-foreground">{value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      </CardContent>
    </Card>
  </motion.div>
);

export default AbacusPractice;
