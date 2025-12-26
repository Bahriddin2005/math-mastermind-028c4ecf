import { useState, useEffect } from 'react';
import { MathSection, Difficulty, getSectionInfo } from '@/lib/mathGenerator';
import { useGameState, GameMode } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SectionCard } from '@/components/SectionCard';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { TimerPicker } from '@/components/TimerPicker';
import { TargetPicker } from '@/components/TargetPicker';
import { ProblemDisplay } from '@/components/ProblemDisplay';
import { StatsDisplay } from '@/components/StatsDisplay';
import { TimerDisplay } from '@/components/TimerDisplay';
import { GameResults } from '@/components/GameResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Play, ArrowLeft, Target, Zap, Brain, Sparkles, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AppState = 'menu' | 'playing' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('menu');
  const [selectedSection, setSelectedSection] = useState<MathSection>('add-sub');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [gameMode, setGameMode] = useState<GameMode>('practice');
  const [timerDuration, setTimerDuration] = useState(60);
  const [targetProblems, setTargetProblems] = useState(10);
  
  const { soundEnabled, toggleSound, playSound } = useSound();
  const { triggerStreakConfetti, triggerCompletionConfetti, resetStreak } = useConfetti();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    currentProblem,
    userAnswer,
    setUserAnswer,
    feedback,
    isGameActive,
    timeLeft,
    stats,
    startGame,
    endGame,
    checkAnswer,
    skipProblem,
  } = useGameState({
    section: selectedSection,
    difficulty,
    mode: gameMode,
    timerDuration,
    targetProblems: gameMode === 'practice' ? targetProblems : 0,
    onCorrect: () => playSound('correct'),
    onIncorrect: () => playSound('incorrect'),
    onComplete: () => {
      playSound('complete');
      setAppState('results');
    },
    onStreakMilestone: (streak) => {
      triggerStreakConfetti(streak);
    },
  });

  // Save game session when results are shown
  useEffect(() => {
    const saveSession = async () => {
      if (appState === 'results' && user && stats.problems > 0) {
        const score = stats.correct * 10 + stats.bestStreak * 5;
        const accuracy = stats.correct / (stats.correct + stats.incorrect);
        
        triggerCompletionConfetti(accuracy * 100);
        
        await supabase.from('game_sessions').insert({
          user_id: user.id,
          section: selectedSection,
          difficulty: difficulty.toString(),
          mode: gameMode,
          correct: stats.correct,
          incorrect: stats.incorrect,
          best_streak: stats.bestStreak,
          total_time: stats.totalTime,
          problems_solved: stats.problems,
          score,
          timer_duration: gameMode === 'timer' ? timerDuration : null,
          target_problems: gameMode === 'practice' ? targetProblems : null,
        });

        const { data: profile } = await supabase
          .from('profiles')
          .select('total_score, total_problems_solved, best_streak')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          await supabase.from('profiles').update({
            total_score: profile.total_score + score,
            total_problems_solved: profile.total_problems_solved + stats.problems,
            best_streak: Math.max(profile.best_streak, stats.bestStreak),
          }).eq('user_id', user.id);
        }
      }
    };

    saveSession();
  }, [appState, user, stats, selectedSection, difficulty, gameMode, timerDuration, targetProblems, triggerCompletionConfetti]);

  const handleStartGame = () => {
    playSound('start');
    resetStreak();
    startGame();
    setAppState('playing');
  };

  const handleBackToMenu = () => {
    endGame();
    setAppState('menu');
  };

  const handlePlayAgain = () => {
    playSound('start');
    resetStreak();
    startGame();
    setAppState('playing');
  };

  const sections: MathSection[] = ['add-sub', 'multiply', 'divide', 'mix'];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-primary/5 to-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6 md:py-8">
        {appState === 'menu' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow p-8 md:p-12 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
              
              <div className="relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="mb-6 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Bosh sahifa
                </Button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Brain className="h-8 w-8" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mental Matematika
                  </Badge>
                </div>

                <h1 className="text-3xl md:text-5xl font-display font-black mb-4 leading-tight">
                  Miyangizni <br className="hidden md:block" />
                  <span className="text-accent">rivojlantiring</span>
                </h1>
                <p className="text-lg text-white/80 max-w-lg">
                  Bo'limni tanlang, qiyinchilik darajasini belgilang va mashq qilishni boshlang!
                </p>
              </div>
            </div>

            {/* Section Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Bo'limni tanlang</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.map((section, index) => (
                  <div 
                    key={section} 
                    className="animate-slide-up" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <SectionCard
                      section={section}
                      onClick={() => setSelectedSection(section)}
                      isActive={selectedSection === section}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Game Settings */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{getSectionInfo(selectedSection).name}</h2>
                    <p className="text-sm text-muted-foreground">{getSectionInfo(selectedSection).description}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Difficulty */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-warning" />
                      <span className="font-medium">Qiyinchilik darajasi</span>
                    </div>
                    <DifficultyPicker value={difficulty} onChange={setDifficulty} />
                  </div>

                  {/* Game Mode */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-accent" />
                      <span className="font-medium">O'yin rejimi</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setGameMode('practice')}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          gameMode === 'practice' 
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl w-fit mb-2 ${gameMode === 'practice' ? 'bg-primary text-white' : 'bg-secondary'}`}>
                          <Play className="h-5 w-5" />
                        </div>
                        <p className="font-semibold">Mashq rejimi</p>
                        <p className="text-xs text-muted-foreground">Belgilangan misollar soni</p>
                      </button>
                      
                      <button
                        onClick={() => setGameMode('timer')}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                          gameMode === 'timer' 
                            ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20' 
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl w-fit mb-2 ${gameMode === 'timer' ? 'bg-accent text-white' : 'bg-secondary'}`}>
                          <Timer className="h-5 w-5" />
                        </div>
                        <p className="font-semibold">Taymer rejimi</p>
                        <p className="text-xs text-muted-foreground">Vaqt cheklangan</p>
                      </button>
                    </div>
                  </div>

                  {/* Mode Options */}
                  <div className="p-4 rounded-2xl bg-secondary/50 space-y-3">
                    {gameMode === 'timer' ? (
                      <>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          Vaqt davomiyligi
                        </p>
                        <TimerPicker value={timerDuration} onChange={setTimerDuration} />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Misollar soni
                        </p>
                        <TargetPicker value={targetProblems} onChange={setTargetProblems} />
                      </>
                    )}
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={handleStartGame}
                    size="xl"
                    className={`w-full text-lg font-bold py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl ${
                      gameMode === 'timer' 
                        ? 'bg-accent hover:bg-accent/90 shadow-accent/30' 
                        : 'gradient-primary shadow-primary/30'
                    }`}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Mashqni boshlash
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {appState === 'playing' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Orqaga
              </Button>
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                {getSectionInfo(selectedSection).name}
              </Badge>
              <div className="w-20" />
            </div>

            {/* Timer */}
            {gameMode === 'timer' && isGameActive && (
              <TimerDisplay 
                timeLeft={timeLeft} 
                totalTime={timerDuration} 
                isActive={isGameActive} 
              />
            )}

            {/* Progress */}
            {gameMode === 'practice' && targetProblems > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Jarayon</span>
                  <span className="text-sm text-muted-foreground">{stats.problems} / {targetProblems}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(stats.problems / targetProblems) * 100}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Stats */}
            <StatsDisplay
              correct={stats.correct}
              incorrect={stats.incorrect}
              streak={stats.streak}
              bestStreak={stats.bestStreak}
            />

            {/* Problem */}
            <Card className="p-6 md:p-8 border-2 border-primary/20">
              <ProblemDisplay
                problem={currentProblem}
                userAnswer={userAnswer}
                onAnswerChange={setUserAnswer}
                onSubmit={checkAnswer}
                onSkip={skipProblem}
                feedback={feedback}
                disabled={!isGameActive}
              />
            </Card>

            {/* End button */}
            {gameMode === 'practice' && isGameActive && targetProblems === 0 && stats.problems >= 5 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    endGame();
                    setAppState('results');
                    playSound('complete');
                  }}
                >
                  Mashqni tugatish
                </Button>
              </div>
            )}
          </div>
        )}

        {appState === 'results' && (
          <div className="max-w-lg mx-auto py-8">
            <GameResults
              stats={stats}
              onPlayAgain={handlePlayAgain}
              onGoHome={() => navigate('/')}
              isLoggedIn={!!user}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;