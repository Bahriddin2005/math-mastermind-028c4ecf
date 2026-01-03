import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MentalArithmeticPractice } from '@/components/MentalArithmeticPractice';
import { useSound } from '@/hooks/useSound';
import { Brain, Calculator } from 'lucide-react';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

const MentalArithmetic = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with Logo */}
          <div className="text-center space-y-4 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            {/* IQROMAX Logo */}
            <div className="flex justify-center mb-2">
              <img 
                src={iqromaxLogo} 
                alt="IQROMAX" 
                className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-md"
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground flex items-center justify-center gap-2">
                <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                Mental Arifmetika
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                Abakus usulida tez hisoblash ko'nikmalarini rivojlantiring
              </p>
            </div>
          </div>

          {/* Features highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <Brain className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Mental hisoblash</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <Calculator className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs font-medium">Abakus vizualizatsiya</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <span className="text-lg">⚡</span>
              <p className="text-xs font-medium">Flash-kartalar</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <span className="text-lg">🏆</span>
              <p className="text-xs font-medium">Multiplayer</p>
            </div>
          </div>

          {/* Main Practice Component */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <MentalArithmeticPractice />
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default MentalArithmetic;
