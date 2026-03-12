import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Calculator, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  RealisticAbacus, 
  FullscreenAbacus,
  type AbacusMode,
} from '@/components/abacus';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

const COLUMN_OPTIONS = [3, 5, 7, 10] as const;

const AbacusSimulator = () => {
  const [columns, setColumns] = useState<number | null>(null);
  const [value, setValue] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const colorScheme = 'classic' as const;
  const mode: AbacusMode = 'beginner';
  const { soundEnabled, toggleSound, playSound } = useSound();

  const handleBeadSound = useCallback(() => {
    if (soundEnabled) {
      playSound('tick');
    }
  }, [soundEnabled, playSound]);

  const handleReset = useCallback(() => {
    setValue(0);
  }, []);

  const handleBack = useCallback(() => {
    setColumns(null);
    setValue(0);
  }, []);

  // Column selection screen
  if (columns === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Orqaga</span>
            </Link>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Abakus Simulator
            </h1>
            <div className="w-9" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div 
            className="w-full max-w-md space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Nechta ustun kerak?</h2>
              <p className="text-sm text-muted-foreground">Abakus ustunlar sonini tanlang</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {COLUMN_OPTIONS.map((col) => (
                <motion.button
                  key={col}
                  onClick={() => setColumns(col)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border/50 bg-card p-6",
                    "hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer",
                    "shadow-sm hover:shadow-md"
                  )}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-4xl font-bold text-primary">{col}</span>
                  <span className="text-xs text-muted-foreground font-medium">ustun</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <>
      <FullscreenAbacus
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        initialColumns={columns}
        initialValue={value}
        initialMode={mode}
        colorScheme={colorScheme}
        onBeadSound={handleBeadSound}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Orqaga</span>
            </button>
            
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span>{columns} ustunli Abakus</span>
            </h1>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={toggleSound} className="w-9 h-9 p-0">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-2 py-4 pb-24 space-y-4">
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="gap-1.5 h-9 px-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </Button>
          </div>
          
          <div className="flex justify-center items-center py-2 w-full max-w-[100vw]">
            <RealisticAbacus
              columns={columns}
              value={value}
              onChange={setValue}
              mode={mode}
              compact
              showValue={false}
              orientation="horizontal"
              colorScheme={colorScheme}
              onBeadSound={handleBeadSound}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default AbacusSimulator;