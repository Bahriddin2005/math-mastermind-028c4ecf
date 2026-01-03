import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { MentalArithmeticPractice } from '@/components/MentalArithmeticPractice';
import { useSound } from '@/hooks/useSound';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

const MentalArithmetic = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-3 sm:px-4 py-3 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Compact Header */}
          <div className="flex items-center justify-center gap-3 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <img 
              src={iqromaxLogo} 
              alt="IQROMAX" 
              className="h-8 sm:h-10 w-auto object-contain dark:brightness-110"
            />
            <div className="h-6 w-px bg-border/50" />
            <span className="text-sm sm:text-base font-medium text-muted-foreground">Mental Arifmetika</span>
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
