import { useState } from 'react';
import { MathSection, Difficulty, getSectionInfo } from '@/lib/mathGenerator';
import { useGameState, GameMode } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { Navbar } from '@/components/Navbar';
import { SectionCard } from '@/components/SectionCard';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { ProblemDisplay } from '@/components/ProblemDisplay';
import { StatsDisplay } from '@/components/StatsDisplay';
import { TimerDisplay } from '@/components/TimerDisplay';
import { GameResults } from '@/components/GameResults';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Timer, Play, ArrowLeft } from 'lucide-react';

type AppState = 'menu' | 'playing' | 'results';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('menu');
  const [selectedSection, setSelectedSection] = useState<MathSection>('add-sub');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [gameMode, setGameMode] = useState<GameMode>('practice');
  
  const { soundEnabled, toggleSound, playSound } = useSound();

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
    timerDuration: 60,
    onCorrect: () => playSound('correct'),
    onIncorrect: () => playSound('incorrect'),
    onComplete: () => {
      playSound('complete');
      setAppState('results');
    },
  });

  const handleStartGame = () => {
    playSound('start');
    startGame();
    setAppState('playing');
  };

  const handleBackToMenu = () => {
    endGame();
    setAppState('menu');
  };

  const handlePlayAgain = () => {
    playSound('start');
    startGame();
    setAppState('playing');
  };

  const sections: MathSection[] = ['add-sub', 'multiply', 'divide', 'mix'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6 md:py-8">
        {appState === 'menu' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Welcome section */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-black">
                Mental Matematika
              </h1>
              <p className="text-muted-foreground text-lg">
                Bo'limni tanlang va mashq qilishni boshlang
              </p>
            </div>

            {/* Section selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sections.map((section, index) => (
                <div key={section} className={`animate-slide-up stagger-${index + 1}`}>
                  <SectionCard
                    section={section}
                    onClick={() => setSelectedSection(section)}
                    isActive={selectedSection === section}
                  />
                </div>
              ))}
            </div>

            {/* Selected section info */}
            <Card className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-display font-bold mb-2">
                    {getSectionInfo(selectedSection).name}
                  </h2>
                  <p className="text-muted-foreground">
                    Murakkablik darajasini tanlang
                  </p>
                </div>

                <DifficultyPicker value={difficulty} onChange={setDifficulty} />

                {/* Game mode selection */}
                <div className="flex justify-center gap-3">
                  <Button
                    variant={gameMode === 'practice' ? 'default' : 'secondary'}
                    size="lg"
                    onClick={() => setGameMode('practice')}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Mashq
                  </Button>
                  <Button
                    variant={gameMode === 'timer' ? 'accent' : 'secondary'}
                    size="lg"
                    onClick={() => setGameMode('timer')}
                  >
                    <Timer className="h-5 w-5 mr-2" />
                    60 soniya
                  </Button>
                </div>

                {/* Start button */}
                <div className="text-center">
                  <Button
                    variant="game"
                    size="xl"
                    onClick={handleStartGame}
                    className="px-12"
                  >
                    Boshlash
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {appState === 'playing' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header with back button and timer */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBackToMenu}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
              <div className="text-center">
                <h2 className="font-display font-bold">
                  {getSectionInfo(selectedSection).name}
                </h2>
              </div>
              <div className="w-20" /> {/* Spacer for alignment */}
            </div>

            {/* Timer (if timer mode) */}
            {gameMode === 'timer' && isGameActive && (
              <TimerDisplay 
                timeLeft={timeLeft} 
                totalTime={60} 
                isActive={isGameActive} 
              />
            )}

            {/* Stats */}
            <StatsDisplay
              correct={stats.correct}
              incorrect={stats.incorrect}
              streak={stats.streak}
              bestStreak={stats.bestStreak}
            />

            {/* Problem */}
            <ProblemDisplay
              problem={currentProblem}
              userAnswer={userAnswer}
              onAnswerChange={setUserAnswer}
              onSubmit={checkAnswer}
              onSkip={skipProblem}
              feedback={feedback}
              disabled={!isGameActive}
            />

            {/* End practice button (for practice mode) */}
            {gameMode === 'practice' && isGameActive && stats.problems >= 5 && (
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
              onGoHome={handleBackToMenu}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2024 IQROMAX - Mental Matematika</p>
      </footer>
    </div>
  );
};

export default Index;
