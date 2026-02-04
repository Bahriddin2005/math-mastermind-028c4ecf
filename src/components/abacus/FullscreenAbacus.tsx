import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Volume2, VolumeX, Minus, Plus, Smartphone, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealisticAbacus } from './RealisticAbacus';
import { useSound } from '@/hooks/useSound';
import { useOrientation } from '@/hooks/useOrientation';
import { cn } from '@/lib/utils';
import type { AbacusMode } from './RealisticAbacus';
import type { AbacusColorScheme } from './AbacusColorScheme';

interface FullscreenAbacusProps {
  isOpen: boolean;
  onClose: () => void;
  initialColumns?: number;
  initialValue?: number;
  initialMode?: AbacusMode;
  colorScheme?: AbacusColorScheme;
}

// Test mode problem generator
const generateTestProblem = () => {
  const a = Math.floor(Math.random() * 500) + 100;
  const b = Math.floor(Math.random() * 400) + 50;
  const operation = Math.random() > 0.5 ? '+' : '-';
  const answer = operation === '+' ? a + b : Math.max(a, b) - Math.min(a, b);
  const problem = operation === '+' 
    ? `${a} + ${b}` 
    : `${Math.max(a, b)} - ${Math.min(a, b)}`;
  return { problem, answer };
};

/**
 * Vertikal Fullscreen Abakus Simulator
 * Professional-grade Soroban simulator with portrait-only mode
 */
export const FullscreenAbacus = ({
  isOpen,
  onClose,
  initialColumns = 13,
  initialValue = 0,
  initialMode = 'beginner',
  colorScheme = 'classic',
}: FullscreenAbacusProps) => {
  const [columns, setColumns] = useState(initialColumns);
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<AbacusMode>(initialMode);
  const [showControls, setShowControls] = useState(true);
  const [testProblem, setTestProblem] = useState<{ problem: string; answer: number } | null>(null);
  const [testResult, setTestResult] = useState<'correct' | 'incorrect' | null>(null);
  const { soundEnabled, toggleSound, playSound } = useSound();
  const deviceOrientation = useOrientation();

  // Fullscreen API with status bar hiding
  useEffect(() => {
    if (isOpen && deviceOrientation === 'portrait') {
      const elem = document.documentElement;
      
      // Request fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
      
      // Lock screen orientation to portrait if supported
      if (screen.orientation && 'lock' in screen.orientation) {
        (screen.orientation as any).lock('portrait').catch(() => {});
      }
      
      // Hide body overflow
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.style.overflow = '';
    };
  }, [isOpen, deviceOrientation]);

  // Generate test problem when mode changes to test
  useEffect(() => {
    if (mode === 'test') {
      const newProblem = generateTestProblem();
      setTestProblem(newProblem);
      setTestResult(null);
      setValue(0);
    }
  }, [mode]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const handleReset = useCallback(() => {
    setValue(0);
    setTestResult(null);
    if (mode === 'test') {
      setTestProblem(generateTestProblem());
    }
  }, [mode]);

  const adjustColumns = useCallback((delta: number) => {
    const newColumns = Math.max(3, Math.min(17, columns + delta));
    setColumns(newColumns);
    const maxValue = Math.pow(10, newColumns) - 1;
    setValue(prev => Math.min(prev, maxValue));
  }, [columns]);

  const handleScreenTap = () => {
    setShowControls(true);
  };

  const checkTestAnswer = useCallback(() => {
    if (!testProblem) return;
    
    const isCorrect = value === testProblem.answer;
    setTestResult(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
  }, [testProblem, value, playSound]);

  const nextTestProblem = useCallback(() => {
    setTestProblem(generateTestProblem());
    setTestResult(null);
    setValue(0);
  }, []);

  const cycleMode = useCallback(() => {
    const modes: AbacusMode[] = ['beginner', 'mental', 'test'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  }, [mode]);

  // Calculate dynamic sizing based on screen
  const abacusScale = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    if (minDimension < 360) return 0.65;
    if (minDimension < 400) return 0.75;
    if (minDimension < 500) return 0.85;
    return 1;
  }, []);

  const modeConfig = useMemo(() => ({
    beginner: { icon: Eye, label: "Boshlang'ich", color: 'from-emerald-500 to-green-600' },
    mental: { icon: EyeOff, label: 'Mental', color: 'from-blue-500 to-indigo-600' },
    test: { icon: HelpCircle, label: 'Test', color: 'from-purple-500 to-pink-600' },
  }), []);

  if (!isOpen) return null;

  // Landscape warning
  if (deviceOrientation === 'landscape') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)',
          height: '100dvh',
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, -20, 20, -20, 0],
            y: [0, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
          className="mb-8"
        >
          <div className="relative">
            <Smartphone className="w-24 h-24 text-primary" />
            <motion.div
              animate={{ rotate: 90 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-2 h-12 bg-primary/30 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-foreground">
          📱 Telefonni Vertikal Holatga O'giring
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-8 text-sm sm:text-base">
          Professional Soroban abakus simulator faqat vertikal (portrait) rejimda ishlaydi. 
          Real abakus tajribasini his qilish uchun telefoningizni to'g'ri holatga o'giring.
        </p>
        
        <Button 
          variant="outline" 
          onClick={onClose} 
          size="lg"
          className="gap-2 px-8"
        >
          <X className="w-5 h-5" />
          Yopish
        </Button>
      </motion.div>
    );
  }

  const ModeIcon = modeConfig[mode].icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100]"
      style={{ 
        height: '100dvh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
      onClick={handleScreenTap}
    >
      {/* Wooden texture overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 right-0 z-50 safe-area-inset-top"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 12px)',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2">
              {/* Top row - Close, Columns, Sound/Reset */}
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white/90 hover:text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                >
                  <X className="w-6 h-6" />
                </Button>

                {/* Column adjuster */}
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustColumns(-1)}
                    disabled={columns <= 3}
                    className="text-white/80 hover:text-white hover:bg-white/20 w-8 h-8 p-0 rounded-full disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-bold min-w-[2.5rem] text-center text-lg">{columns}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustColumns(1)}
                    disabled={columns >= 17}
                    className="text-white/80 hover:text-white hover:bg-white/20 w-8 h-8 p-0 rounded-full disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSound}
                    className="text-white/90 hover:text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-white/90 hover:text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Mode selector - compact pill buttons */}
              <div className="flex justify-center">
                <button
                  onClick={cycleMode}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-gradient-to-r text-white font-medium text-sm",
                    "transition-all duration-300 shadow-lg",
                    modeConfig[mode].color
                  )}
                >
                  <ModeIcon className="w-4 h-4" />
                  {modeConfig[mode].label}
                  <span className="text-white/60 text-xs">→ bosing</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Mode Problem Display */}
      <AnimatePresence>
        {mode === 'test' && testProblem && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-28 left-4 right-4 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl">
              <p className="text-white/70 text-xs mb-1">Masala:</p>
              <p className="text-white text-3xl font-bold">{testProblem.problem} = ?</p>
              
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-3 py-2 px-4 rounded-lg inline-block",
                    testResult === 'correct' ? "bg-green-500/80" : "bg-red-500/80"
                  )}
                >
                  <span className="text-white font-bold">
                    {testResult === 'correct' 
                      ? "✅ To'g'ri!" 
                      : `❌ Noto'g'ri. Javob: ${testProblem.answer}`}
                  </span>
                </motion.div>
              )}
              
              <div className="flex justify-center gap-2 mt-3">
                {!testResult ? (
                  <Button
                    onClick={checkTestAnswer}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    Tekshirish
                  </Button>
                ) : (
                  <Button
                    onClick={nextTestProblem}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    Keyingi →
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abacus - Centered, rotated 90deg for vertical phone */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ 
          paddingTop: mode === 'test' && showControls ? '200px' : '100px', 
          paddingBottom: '120px',
        }}
      >
        <div 
          className="transform rotate-90 origin-center"
          style={{
            width: `calc((100dvh - ${mode === 'test' && showControls ? '320px' : '220px'}) * ${abacusScale})`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <RealisticAbacus
            columns={columns}
            value={value}
            onChange={setValue}
            mode={mode}
            showValue={false}
            compact
            colorScheme={colorScheme}
          />
        </div>
      </div>

      {/* Bottom Value Display */}
      <AnimatePresence>
        {showControls && mode !== 'mental' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 z-50"
            style={{ 
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center px-4 py-4">
              <motion.div
                key={value}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="inline-block"
              >
                <div className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                  <span className="text-5xl sm:text-6xl font-bold text-white tracking-wider">
                    {value.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mental mode indicator */}
      {mode === 'mental' && showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30">
            <EyeOff className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Mental rejim - raqamlar yashirin</span>
          </div>
        </motion.div>
      )}

      {/* Tap hint when controls hidden */}
      {!showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: 3, times: [0, 0.1, 0.9, 1] }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs"
        >
          Boshqaruvni ko'rish uchun ekranga bosing
        </motion.div>
      )}
    </motion.div>
  );
};
