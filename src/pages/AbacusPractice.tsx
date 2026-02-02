import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Play, RotateCcw, Check, Trophy, Clock, Target, Minus, Plus, Monitor, Smartphone, Maximize2, Volume2, VolumeX, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const AbacusPractice = () => {
  const { user } = useAuth();
  const { playSound, soundEnabled, toggleSound } = useSound();
  const isMobile = useIsMobile();
  
  // Abakus sozlamalari
  const [abacusColumns, setAbacusColumns] = useState(5);
  const [abacusMode, setAbacusMode] = useState<AbacusMode>('beginner');
  const [abacusOrientation, setAbacusOrientation] = useState<AbacusOrientation>('horizontal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAbacusSettings, setShowAbacusSettings] = useState(false);
  
  // Sozlamalar
  const [settings, setSettings] = useState<PracticeSettings>({
    digitCount: 1,
    termCount: 5,
    formulaType: 'formulasiz',
    problemCount: 10,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // O'yin holati
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'answer' | 'results'>('idle');
  const [currentProblem, setCurrentProblem] = useState<GeneratedProblem | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [abacusValue, setAbacusValue] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Vaqt va statistika
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTime: 0,
    correctAnswers: 0,
    problems: [],
  });
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Vaqt hisoblagich
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'answer') {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - problemStartTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, problemStartTime]);

  // Yangi misol yaratish
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
    // Abakusni startValue ga o'rnatish - bu muhim!
    // Misol boshida foydalanuvchi startValue ni abakusda ko'rsatishi kerak
    setAbacusValue(problem.startValue);
    setProblemStartTime(Date.now());
    setElapsedTime(0);
    setGameState('playing');
  }, [settings]);

  // O'yinni boshlash
  const startGame = () => {
    setProblemIndex(0);
    setSessionStats({
      totalTime: 0,
      correctAnswers: 0,
      problems: [],
    });
    generateNewProblem();
  };

  // Abakus qiymatini tekshirish
  useEffect(() => {
    if (gameState !== 'playing' || !currentProblem) return;
    
    // startValue dan boshlab yig'ish - bu muhim!
    // Misol: startValue=5, sequence=[+2, -2, +7]
    // Step 0: 5 + 2 = 7
    // Step 1: 5 + 2 + (-2) = 5  
    // Step 2: 5 + 2 + (-2) + 7 = 12
    const expectedValue = currentProblem.startValue + currentProblem.sequence
      .slice(0, currentStep + 1)
      .reduce((sum, val) => sum + val, 0);
    
    if (abacusValue === expectedValue) {
      playSound('correct');
      
      // Keyingi qadamga o'tish
      if (currentStep < currentProblem.sequence.length - 1) {
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, 300);
      } else {
        // Misol tugadi, javob kiritish
        setTimeout(() => {
          setGameState('answer');
        }, 500);
      }
    }
  }, [abacusValue, currentStep, currentProblem, gameState, playSound]);

  // Javobni tekshirish
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
    
    // Statistikani yangilash
    setSessionStats(prev => ({
      totalTime: prev.totalTime + problemTime,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      problems: [...prev.problems, { time: problemTime, correct: isCorrect }],
    }));
    
    // Keyingi misolga o'tish yoki natijalarni ko'rsatish
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

  // Sessiyani saqlash
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

  // Joriy amal
  const currentOperation = currentProblem?.sequence[currentStep];
  // startValue dan boshlab hisoblash - bu muhim!
  const expectedValue = currentProblem 
    ? currentProblem.startValue + currentProblem.sequence
        .slice(0, currentStep + 1)
        .reduce((sum, val) => sum + val, 0)
    : 0;

  // Vaqtni formatlash
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/abacus-simulator" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2">
            {gameState !== 'idle' && gameState !== 'results' && (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  {problemIndex + 1}/{settings.problemCount}
                </span>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {formatTime(elapsedTime)}
                </span>
              </>
            )}
          </div>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sozlamalar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Xonalar soni</label>
                  <Select 
                    value={settings.digitCount.toString()} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, digitCount: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 xonali</SelectItem>
                      <SelectItem value="2">2 xonali</SelectItem>
                      <SelectItem value="3">3 xonali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hadlar soni</label>
                  <Select 
                    value={settings.termCount.toString()} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, termCount: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ta had</SelectItem>
                      <SelectItem value="5">5 ta had</SelectItem>
                      <SelectItem value="7">7 ta had</SelectItem>
                      <SelectItem value="10">10 ta had</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formula turi</label>
                  <Select 
                    value={settings.formulaType} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, formulaType: v as FormulaCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formulasiz">Formulasiz</SelectItem>
                      <SelectItem value="kichik_dost">Kichik do'st (5)</SelectItem>
                      <SelectItem value="katta_dost">Katta do'st (10)</SelectItem>
                      <SelectItem value="mix">Aralash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Misollar soni</label>
                  <Select 
                    value={settings.problemCount.toString()} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, problemCount: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 ta</SelectItem>
                      <SelectItem value="10">10 ta</SelectItem>
                      <SelectItem value="15">15 ta</SelectItem>
                      <SelectItem value="20">20 ta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button className="w-full" onClick={() => setSettingsOpen(false)}>
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

      <main className="container mx-auto px-4 py-4 pb-24">
        <AnimatePresence mode="wait">
          {/* Boshlash ekrani */}
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="pt-6 text-center">
                  <div className="text-6xl mb-4">🧮</div>
                  <h1 className="text-2xl font-bold mb-2">Abakus Amaliyot</h1>
                  <p className="text-muted-foreground">
                    Misollarni abakusda ishlang va tez hisoblashni o'rganing!
                  </p>
                </CardContent>
              </Card>
              
              {/* Abakus sozlamalari */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Abakus Sozlamalari
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rejim tanlash */}
                  <AbacusModeSelector mode={abacusMode} onChange={setAbacusMode} />
                  
                  {/* Ustunlar soni */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ustunlar soni:</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAbacusColumns(prev => Math.max(3, prev - 1))}
                        disabled={abacusColumns <= 3}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-lg">{abacusColumns}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setAbacusColumns(prev => Math.min(17, prev + 1))}
                        disabled={abacusColumns >= 17}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Yo'nalish tanlash */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Yo'nalish:</span>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={abacusOrientation === 'horizontal' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setAbacusOrientation('horizontal')}
                        className="h-8 px-3 gap-1.5"
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Gorizontal</span>
                      </Button>
                      <Button
                        variant={abacusOrientation === 'vertical' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setAbacusOrientation('vertical')}
                        className="h-8 px-3 gap-1.5"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Vertikal</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Fullscreen tugmasi */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="w-full gap-1.5 h-9 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Fullscreen Rejim</span>
                  </Button>
                </CardContent>
              </Card>
              
              {/* Joriy sozlamalar */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Xonalar:</span>
                      <span className="font-medium">{settings.digitCount} xonali</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hadlar:</span>
                      <span className="font-medium">{settings.termCount} ta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formula:</span>
                      <span className="font-medium capitalize">{settings.formulaType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Misollar:</span>
                      <span className="font-medium">{settings.problemCount} ta</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                size="lg" 
                className="w-full text-lg py-6 gap-3"
                onClick={startGame}
              >
                <Play className="w-6 h-6" />
                Boshlash
              </Button>
            </motion.div>
          )}

          {/* O'yin ekrani */}
          {(gameState === 'playing' || gameState === 'answer') && currentProblem && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Abakus settings quick access */}
              <div className="flex justify-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="gap-1.5 h-8 px-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className="w-8 h-8 p-0"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className={cn(
                "flex gap-4",
                isMobile ? "flex-col" : "flex-row"
              )}>
                {/* Abakus */}
                <div className={cn("flex-1 flex justify-center items-start", isMobile && "order-1")}>
                  <RealisticAbacus
                    columns={abacusColumns}
                    value={abacusValue}
                    onChange={setAbacusValue}
                    mode={abacusMode}
                    showValue={abacusMode !== 'mental'}
                    orientation={abacusOrientation}
                    readOnly={gameState === 'answer'}
                    compact={isMobile}
                  />
                </div>
              
              {/* Amallar paneli */}
              <div className={cn(
                "space-y-4",
                isMobile ? "order-2 w-full" : "w-80"
              )}>
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Misol {problemIndex + 1}/{settings.problemCount}</span>
                    <span className="font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                  <Progress value={(problemIndex / settings.problemCount) * 100} />
                </div>
                
                {gameState === 'playing' && (
                  <>
                    {/* Boshlang'ich qiymat */}
                    <Card className="border-accent/50 bg-accent/5">
                      <CardContent className="py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Boshlang'ich:</span>
                          <span className="text-xl font-bold text-accent">{currentProblem.startValue}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Joriy amal */}
                    <Card className="border-primary bg-primary/10">
                      <CardContent className="pt-4 text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          Qadam {currentStep + 1}/{currentProblem.sequence.length}
                        </div>
                        <div className="text-4xl font-bold text-primary">
                          {currentOperation && currentOperation >= 0 ? '+' : ''}{currentOperation}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Kutilayotgan: {expectedValue}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Keyingi amallar */}
                    {currentStep < currentProblem.sequence.length - 1 && (
                      <Card>
                        <CardContent className="pt-3">
                          <div className="text-xs text-muted-foreground mb-2">Keyingi:</div>
                          <div className="flex flex-wrap gap-2">
                            {currentProblem.sequence.slice(currentStep + 1, currentStep + 4).map((op, i) => (
                              <span 
                                key={i}
                                className="px-2 py-1 bg-muted rounded text-sm font-mono"
                              >
                                {op >= 0 ? '+' : ''}{op}
                              </span>
                            ))}
                            {currentProblem.sequence.length - currentStep - 1 > 3 && (
                              <span className="text-muted-foreground">...</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
                
                {gameState === 'answer' && (
                  <Card className="border-accent bg-accent/10">
                    <CardContent className="pt-4 space-y-4">
                      <div className="text-center">
                        <div className="text-lg font-medium mb-2">Javobni kiriting</div>
                        <Input
                          type="number"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          className="text-center text-2xl font-bold h-14"
                          placeholder="?"
                          autoFocus
                        />
                      </div>
                      <Button 
                        className="w-full gap-2"
                        onClick={checkAnswer}
                        disabled={!userAnswer}
                      >
                        <Check className="w-5 h-5" />
                        Tekshirish
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              </div>
            </motion.div>
          )}

          {/* Natijalar ekrani */}
          {gameState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="pt-6 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h1 className="text-2xl font-bold mb-2">Sessiya tugadi!</h1>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-card rounded-lg p-4">
                      <Target className="w-6 h-6 mx-auto text-primary mb-2" />
                      <div className="text-2xl font-bold">
                        {sessionStats.correctAnswers}/{settings.problemCount}
                      </div>
                      <div className="text-xs text-muted-foreground">To'g'ri</div>
                    </div>
                    
                    <div className="bg-card rounded-lg p-4">
                      <Clock className="w-6 h-6 mx-auto text-accent mb-2" />
                      <div className="text-2xl font-bold">
                        {formatTime(sessionStats.totalTime)}
                      </div>
                      <div className="text-xs text-muted-foreground">Umumiy vaqt</div>
                    </div>
                    
                    <div className="bg-card rounded-lg p-4">
                      <Trophy className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                      <div className="text-2xl font-bold">
                        {Math.round((sessionStats.correctAnswers / settings.problemCount) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Aniqlik</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setGameState('idle')}
                >
                  <Settings className="w-5 h-5" />
                  Sozlamalar
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={startGame}
                >
                  <RotateCcw className="w-5 h-5" />
                  Qayta boshlash
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AbacusPractice;
