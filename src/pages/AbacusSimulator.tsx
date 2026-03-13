import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Calculator, Settings2, Volume2, VolumeX, Smartphone, Monitor, Maximize2, Minus, Plus, Columns3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  RealisticAbacus, 
  AbacusModeSelector,
  FullscreenAbacus,
  type AbacusMode,
  type AbacusOrientation,
} from '@/components/abacus';
import { useSound } from '@/hooks/useSound';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type BeadSoundType = 'pop' | 'bead' | 'beadHigh' | 'tick' | 'correct' | 'incorrect' | 'start' | 'countdown' | 'combo' | 'levelUp' | 'complete' | 'winner' | 'whoosh' | 'sparkle' | 'bounce';

const COLUMN_OPTIONS = [
  { value: 3, label: '3', description: "Yuzlikgacha", gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', activeGradient: 'from-emerald-500 to-teal-600' },
  { value: 5, label: '5', description: "O'n minglikgacha", gradient: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30', activeGradient: 'from-blue-500 to-indigo-600' },
  { value: 7, label: '7', description: "Milliongacha", gradient: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', activeGradient: 'from-amber-500 to-orange-600' },
  { value: 10, label: '10', description: "Milliardgacha", gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', activeGradient: 'from-rose-500 to-pink-600' },
];

const ColumnSelector = ({ onSelect }: { onSelect: (cols: number) => void }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium hidden sm:inline">Orqaga</span>
          </Link>
          <h1 className="text-lg font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground/20 flex items-center justify-center">
              <Calculator className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            Abakus Simulator
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Selection screen */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-md space-y-10"
        >
          {/* Title */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10"
            >
              <Columns3 className="w-9 h-9 text-primary" />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Ustunlar soni
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Nechta ustunli abakusda mashq qilmoqchisiz?
            </p>
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-3">
            {COLUMN_OPTIONS.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.07, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(option.value)}
                className={cn(
                  "relative group rounded-2xl p-5 text-center transition-all duration-300",
                  "bg-card/80 backdrop-blur-sm border-2",
                  option.border,
                  "hover:shadow-xl hover:shadow-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background",
                  "overflow-hidden"
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", option.gradient)} />
                <div className="relative space-y-2">
                  <div className={cn(
                    "text-4xl font-black tracking-tight bg-gradient-to-br bg-clip-text text-transparent",
                    option.activeGradient
                  )}>
                    {option.label}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const AbacusSimulator = () => {
  const isMobile = useIsMobile();
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
      // Auto-switch orientation on mobile
      if (isMobile) {
        setOrientation(newColumns > 5 ? 'vertical' : 'horizontal');
      }
      return newColumns;
    });
  }, [isMobile]);

  const columnLabels = [
    'Birlik', "O'nlik", 'Yuzlik', 'Minglik', "O'n minglik", "Yuz minglik",
    'Million', "O'n mln", "Yuz mln", 'Milliard', "O'n mlrd", "Yuz mlrd",
    'Trillion', "O'n trln", "Yuz trln", "Ming trln", "O'n ming trln"
  ];

  const handleColumnSelect = useCallback((cols: number) => {
    setColumns(cols);
    // Mobile: auto-switch to vertical for 5+ columns
    if (isMobile && cols > 5) {
      setOrientation('vertical');
    } else {
      setOrientation('horizontal');
    }
  }, [isMobile]);

  if (columns === null) {
    return <ColumnSelector onSelect={handleColumnSelect} />;
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

      <div className="min-h-screen bg-background relative">
        {/* Subtle ambient background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-accent/3 rounded-full blur-[120px]" />
        </div>

        {/* Glass header */}
        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => { setColumns(null); setValue(0); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/80 group-hover:bg-muted flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </div>
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                <Calculator className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">
                  <span className="hidden sm:inline">Abakus Simulator</span>
                  <span className="sm:hidden">Abakus</span>
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  {columns} ustunli · {mode === 'beginner' ? "Boshlang'ich" : mode === 'mental' ? 'Mental' : 'Test'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" size="sm" 
                onClick={toggleSound} 
                className="w-9 h-9 p-0 rounded-xl hover:bg-muted/80"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <Button 
                variant="ghost" size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "w-9 h-9 p-0 rounded-xl transition-colors",
                  showSettings ? "bg-primary/10 text-primary" : "hover:bg-muted/80"
                )}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-border/50 mx-0.5 hidden sm:block" />
              <Button 
                variant="ghost" size="sm" 
                onClick={handleReset} 
                className="gap-1.5 rounded-xl hover:bg-muted/80 h-9 px-3"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Reset</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-5 pb-24 space-y-5 relative z-10">
          {/* Mode selector — refined card */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 p-3 shadow-sm">
              <AbacusModeSelector mode={mode} onChange={setMode} />
            </div>
          </motion.div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/30 p-5 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Sozlamalar</h3>
                  </div>

                  {/* Columns adjuster */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ustunlar soni</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => adjustColumns(-1)} 
                        disabled={columns <= 3}
                        className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-lg tabular-nums text-foreground">{columns}</span>
                      <button 
                        onClick={() => adjustColumns(1)} 
                        disabled={columns >= 17}
                        className="w-8 h-8 rounded-lg bg-muted/80 hover:bg-muted flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Orientation toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Yo'nalish</span>
                    <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
                      <button
                        onClick={() => setOrientation('horizontal')}
                        className={cn(
                          "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all",
                          orientation === 'horizontal' 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Gorizontal</span>
                      </button>
                      <button
                        onClick={() => setOrientation('vertical')}
                        className={cn(
                          "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all",
                          orientation === 'vertical' 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Vertikal</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Column labels */}
                  <div className="pt-2 border-t border-border/20">
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {Array.from({ length: columns }).reverse().map((_, i) => {
                        const colIndex = columns - 1 - i;
                        return (
                          <span 
                            key={colIndex}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors",
                              colIndex === 0 
                                ? "bg-primary/15 text-primary border border-primary/20" 
                                : "bg-muted/60 text-muted-foreground"
                            )}
                          >
                            {columnLabels[colIndex]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Abacus area */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* Fullscreen button */}
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 h-8 px-4 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
            
            {/* Abacus container */}
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
