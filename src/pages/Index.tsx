import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MentalArithmeticPractice } from '@/components/MentalArithmeticPractice';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-primary/5 to-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-glow p-6 md:p-10 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            
            <div className="relative z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="mb-4 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Bosh sahifa
              </Button>

              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Brain className="h-7 w-7" />
                </div>
                <Badge className="bg-white/20 text-white border-0 text-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mental Arifmetika
                </Badge>
              </div>

              <h1 className="text-2xl md:text-4xl font-display font-black mb-2 leading-tight">
                Sonlarni yodda hisoblash
              </h1>
              <p className="text-base text-white/80 max-w-lg">
                Sonlar ketma-ket ko'rsatiladi. Ularni abacusda tasavvur qilib, natijani toping!
              </p>
            </div>
          </div>

          {/* Mental Arithmetic Practice */}
          <MentalArithmeticPractice />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
