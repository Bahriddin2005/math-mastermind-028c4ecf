import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { MentalArithmeticPractice } from '@/components/MentalArithmeticPractice';
import { useSound } from '@/hooks/useSound';
import { Brain, Sparkles } from 'lucide-react';

const MentalArithmetic = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-5xl w-full mx-auto space-y-4">
          {/* Compact Header */}
          <div className="relative opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <div className="flex flex-col items-center text-center gap-2">
              {/* Icon with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              {/* Title */}
              <div className="space-y-0.5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 justify-center">
                  <span className="text-gradient-primary">Mental Arifmetika</span>
                  <Sparkles className="h-4 w-4 text-accent animate-bounce-soft" />
                </h1>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Aqliy hisoblash qobiliyatingizni rivojlantiring
                </p>
              </div>
            </div>
          </div>

          {/* Main Practice Component */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <MentalArithmeticPractice />
          </div>
        </div>
      </main>
    </PageBackground>
  );
};

export default MentalArithmetic;