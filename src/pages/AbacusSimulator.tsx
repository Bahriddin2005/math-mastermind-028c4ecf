import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Calculator, Settings2, Volume2, VolumeX, Smartphone, Monitor, Maximize2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  RealisticAbacus, 
  AbacusModeSelector,
  FullscreenAbacus,
  type AbacusMode,
  type AbacusOrientation,
} from '@/components/abacus';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

export type BeadSoundType = 'pop' | 'bead' | 'beadHigh' | 'tick' | 'correct' | 'incorrect' | 'start' | 'countdown' | 'combo' | 'levelUp' | 'complete' | 'winner' | 'whoosh' | 'sparkle' | 'bounce';

const COLUMN_OPTIONS = [
  { value: 3, label: '3 ta', description: "Yuzlikgacha", icon: '🟢' },
  { value: 5, label: '5 ta', description: "O'n minglikgacha", icon: '🔵' },
  { value: 7, label: '7 ta', description: "Milliongacha", icon: '🟡' },
  { value: 10, label: '10 ta', description: "Milliardgacha", icon: '🔴' },
];

const ColumnSelector = ({ onSelect }: { onSelect: (cols: number) => void }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex flex-col">
      {/* Header */}
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
          <div className="w-10" />
        </div>
      </header>

      {/* Selection screen */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-lg space-y-8"
        >
          {/* Title */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="text-5xl mb-4"
            >
              🧮
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ustunlar sonini tanlang
            </h2>
            <p className="text-muted-foreground text-sm">
              Nechta ustunli abakusda mashq qilmoqchisiz?
            </p>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-4">
            {COLUMN_OPTIONS.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08, type: 'spring' }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(option.value)}
                className={cn(
                  "relative group rounded-2xl p-6 text-left transition-all duration-200",
                  "bg-card border-2 border-border/60 hover:border-primary/50",
                  "hover:shadow-lg hover:shadow-primary/10",
                  "focus:outline-none focus:ring-2 focus:ring-primary/40"
                )}
              >
                <div className="space-y-3">
                  <span className="text-3xl block">{option.icon}</span>
                  <div>
                    <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const AbacusSimulator = () => {
  const [columns, setColumns] = useState<number | null>(null);
  const [value, setValue] = useState(0);
  const [mode, setMode] = useState<AbacusMode>('beginner');
  const [orientation, setOrientation] = useState<AbacusOrientation>('horizontal');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const colorScheme = 'classic' as const;
  const { soundEnabled, toggleSound, playSound } = useSound();

  const handleBeadSound = useCallback(() => {
    if (soundEnabled) {
      playSound('tick');
    }
  }, [soundEnabled, playSound]);

  const handleReset = useCallback(() => {
    setValue(0);
  }, []);

  const adjustColumns = useCallback((delta: number) => {
    setColumns(prev => {
      const current = prev ?? 10;
      const newColumns = Math.max(3, Math.min(17, current + delta));
      const maxValue = Math.pow(10, newColumns) - 1;
      setValue(v => Math.min(v, maxValue));
      return newColumns;
    });
  }, []);

  const columnLabels = [
    'Birlik', "O'nlik", 'Yuzlik', 'Minglik', "O'n minglik", "Yuz minglik",
    'Million', "O'n mln", "Yuz mln", 'Milliard', "O'n mlrd", "Yuz mlrd",
    'Trillion', "O'n trln", "Yuz trln", "Ming trln", "O'n ming trln"
  ];

  // Show column selector if not yet chosen
  if (columns === null) {
    return <ColumnSelector onSelect={(cols) => setColumns(cols)} />;
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
            <button
              onClick={() => { setColumns(null); setValue(0); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Orqaga</span>
            </button>
            
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="hidden sm:inline">Abakus Simulator</span>
              <span className="sm:hidden">Abakus</span>
            </h1>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={toggleSound} className="w-9 h-9 p-0">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className={cn("w-9 h-9 p-0", showSettings && "bg-primary/10")}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <AbacusModeSelector mode={mode} onChange={setMode} />
          </motion.div>

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Sozlamalar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ustunlar soni:</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => adjustColumns(-1)} disabled={columns <= 3} className="w-8 h-8 p-0">
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-bold text-lg">{columns}</span>
                      <Button variant="outline" size="sm" onClick={() => adjustColumns(1)} disabled={columns >= 17} className="w-8 h-8 p-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Yo'nalish:</span>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={orientation === 'horizontal' ? 'default' : 'ghost'}
                        size="sm" onClick={() => setOrientation('horizontal')}
                        className="h-8 px-3 gap-1.5"
                      >
                        <Monitor className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Gorizontal</span>
                      </Button>
                      <Button
                        variant={orientation === 'vertical' ? 'default' : 'ghost'}
                        size="sm" onClick={() => setOrientation('vertical')}
                        className="h-8 px-3 gap-1.5"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Vertikal</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: columns }).reverse().map((_, i) => {
                      const colIndex = columns - 1 - i;
                      return (
                        <span 
                          key={colIndex}
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            colIndex === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {columnLabels[colIndex]}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="flex justify-center gap-2 mb-3">
              <Button
                variant="outline" size="sm"
                onClick={() => setIsFullscreen(true)}
                className="gap-1.5 h-9 px-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
            </div>
            
            <div className={cn(
              "flex justify-center items-center py-6 w-full max-w-[100vw]",
              orientation === 'vertical' && "min-h-[400px]"
            )}>
              <RealisticAbacus
                columns={columns}
                value={value}
                onChange={setValue}
                mode={mode}
                showValue={mode !== 'mental'}
                orientation={orientation}
                colorScheme={colorScheme}
                onBeadSound={handleBeadSound}
              />
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default AbacusSimulator;
