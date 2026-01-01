import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DailyChallenge } from '@/components/DailyChallenge';
import { useSound } from '@/hooks/useSound';
import { Flame, ArrowLeft, Timer, Hash, Gauge, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Formula qoidalari
const RULES_ALL: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  1: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1] },
  2: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2] },
  3: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3] },
  4: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4] },
  5: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5] },
  6: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6] },
  7: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7] },
  8: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8] },
  9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

interface ChallengeData {
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  seed: number;
}

// Seed-based random generator for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const DailyChallengePage = () => {
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const runningResultRef = useRef(0);
  const seedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGoBack = () => {
    navigate('/train');
  };

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const { data, error } = await supabase.rpc('get_or_create_daily_challenge');
        if (error) throw error;
        if (data) {
          setChallengeData({
            formula_type: data.formula_type,
            digit_count: data.digit_count,
            speed: data.speed,
            problem_count: data.problem_count,
            seed: data.seed,
          });
        }
      } catch (error) {
        console.error('Error loading challenge:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChallenge();
  }, []);

  // Generate numbers with animation
  useEffect(() => {
    if (!challengeData) return;
    
    seedRef.current = challengeData.seed;
    const maxInitial = Math.pow(10, challengeData.digit_count) - 1;
    const minInitial = challengeData.digit_count === 1 ? 1 : Math.pow(10, challengeData.digit_count - 1);
    
    seedRef.current++;
    const range = maxInitial - minInitial + 1;
    const initialResult = minInitial + Math.floor(seededRandom(seedRef.current) * range);
    
    runningResultRef.current = initialResult;
    setDisplayNumber(initialResult);
    setIsAddition(true);
    
    const generateNextNumber = () => {
      const currentResult = runningResultRef.current;
      const lastDigit = Math.abs(currentResult) % 10;
      const rules = RULES_ALL[lastDigit];
      
      if (!rules) return;
      
      const possibleOperations: { number: number; isAdd: boolean }[] = [];
      rules.add.forEach(num => possibleOperations.push({ number: num, isAdd: true }));
      rules.subtract.forEach(num => possibleOperations.push({ number: num, isAdd: false }));
      
      if (possibleOperations.length === 0) return;
      
      seedRef.current++;
      const randomIndex = Math.floor(seededRandom(seedRef.current) * possibleOperations.length);
      const randomOp = possibleOperations[randomIndex];
      
      let finalNumber = randomOp.number;
      if (challengeData.digit_count > 1) {
        seedRef.current++;
        const multiplierIndex = Math.floor(seededRandom(seedRef.current) * challengeData.digit_count);
        const multiplier = Math.pow(10, multiplierIndex);
        finalNumber = randomOp.number * Math.min(multiplier, Math.pow(10, challengeData.digit_count - 1));
      }
      
      if (randomOp.isAdd) {
        runningResultRef.current += finalNumber;
      } else {
        runningResultRef.current -= finalNumber;
      }
      
      setDisplayNumber(finalNumber);
      setIsAddition(randomOp.isAdd);
    };
    
    const speedMs = challengeData.speed * 1000;
    intervalRef.current = setInterval(generateNextNumber, speedMs);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [challengeData]);

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1">
        <div className="container px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent via-orange-500 to-accent flex items-center justify-center shadow-lg">
                    <Flame className="h-5 w-5 sm:h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
                      Kunlik musobaqa
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Kunlik vazifalarni bajaring va mukofotlarga erishing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Parameters Menu */}
            {!loading && challengeData && (
              <>
                <div className="opacity-0 animate-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                  <div className="bg-gradient-to-br from-card/95 via-card/90 to-primary/5 backdrop-blur-md border-2 border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl shadow-black/5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                      <div className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl sm:rounded-2xl border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Hash className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Turi</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{challengeData.formula_type}</p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-success/10 via-success/5 to-transparent rounded-xl sm:rounded-2xl border border-success/20 hover:border-success/40 transition-all duration-300 hover:shadow-lg hover:shadow-success/20 group">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Layers className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-success" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Xona</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{challengeData.digit_count}-xon</p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-warning/10 via-warning/5 to-transparent rounded-xl sm:rounded-2xl border border-warning/20 hover:border-warning/40 transition-all duration-300 hover:shadow-lg hover:shadow-warning/20 group">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Gauge className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-warning" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Tezlik</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{challengeData.speed}s</p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-xl sm:rounded-2xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 group">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Timer className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-accent" />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Sonlar</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-foreground">{challengeData.problem_count}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Number Display - Outside the card */}
                {displayNumber !== null && (
                  <div className="opacity-0 animate-slide-up flex items-center justify-center py-8 sm:py-12 md:py-16" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                    <div className="text-center w-full">
                      <div className="text-[100px] sm:text-[150px] md:text-[200px] lg:text-[250px] font-bold leading-none transition-all duration-300 text-foreground">
                        {isAddition ? '+' : '−'}{displayNumber}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Daily Challenge Component */}
            <div className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <DailyChallenge />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </PageBackground>
  );
};

export default DailyChallengePage;

