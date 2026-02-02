import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Volume2, VolumeX, Minus, Plus, Smartphone, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealisticAbacus } from './RealisticAbacus';
import { AbacusModeSelector } from './AbacusModeSelector';
import { useSound } from '@/hooks/useSound';
import { useOrientation } from '@/hooks/useOrientation';
import { cn } from '@/lib/utils';
import type { AbacusMode } from './RealisticAbacus';

interface FullscreenAbacusProps {
  isOpen: boolean;
  onClose: () => void;
  initialColumns?: number;
  initialValue?: number;
  initialMode?: AbacusMode;
}

/**
 * Vertikal Fullscreen Abakus Simulator
 * Portrait rejimda to'liq ekran, landscape da ogohlantirish
 */
export const FullscreenAbacus = ({
  isOpen,
  onClose,
  initialColumns = 13,
  initialValue = 0,
  initialMode = 'beginner',
}: FullscreenAbacusProps) => {
  const [columns, setColumns] = useState(initialColumns);
  const [value, setValue] = useState(initialValue);
  const [mode, setMode] = useState<AbacusMode>(initialMode);
  const [showControls, setShowControls] = useState(true);
  const { soundEnabled, toggleSound } = useSound();
  const deviceOrientation = useOrientation();

  // Fullscreen API
  useEffect(() => {
    if (isOpen && deviceOrientation === 'portrait') {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    }
    
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isOpen, deviceOrientation]);

  // Hide controls after 3 seconds
  useEffect(() => {
    if (!showControls) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const handleReset = useCallback(() => {
    setValue(0);
  }, []);

  const adjustColumns = useCallback((delta: number) => {
    const newColumns = Math.max(3, Math.min(17, columns + delta));
    setColumns(newColumns);
    const maxValue = Math.pow(10, newColumns) - 1;
    setValue(prev => Math.min(prev, maxValue));
  }, [columns]);

  const handleScreenTap = () => {
    setShowControls(true);
  };

  if (!isOpen) return null;

  // Landscape warning
  if (deviceOrientation === 'landscape') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8"
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          className="mb-6"
        >
          <Smartphone className="w-20 h-20 text-primary" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-center mb-3">
          📱 Telefonni Vertikal Holatga O'giring
        </h2>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Abakus simulator faqat vertikal (portrait) rejimda ishlaydi. 
          Iltimos, telefoningizni to'g'ri holatga o'giring.
        </p>
        
        <Button variant="outline" onClick={onClose} className="gap-2">
          <X className="w-4 h-4" />
          Yopish
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
      style={{ height: '100dvh' }}
      onClick={handleScreenTap}
    >
      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 p-3 bg-gradient-to-b from-black/60 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustColumns(-1)}
                  disabled={columns <= 3}
                  className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-white font-bold min-w-[2rem] text-center">{columns}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustColumns(1)}
                  disabled={columns >= 17}
                  className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 p-0"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mode selector */}
            <div className="mt-2">
              <AbacusModeSelector mode={mode} onChange={setMode} compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abacus - Centered and scaled */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ paddingTop: '80px', paddingBottom: '100px' }}
      >
        <div 
          className="transform rotate-90 origin-center"
          style={{
            width: 'calc(100dvh - 180px)',
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
          />
        </div>
      </div>

      {/* Bottom Value Display */}
      <AnimatePresence>
        {showControls && mode !== 'mental' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                key={value}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-block px-6 py-3 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30"
              >
                <span className="text-4xl sm:text-5xl font-bold text-white">
                  {value.toLocaleString()}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      {!showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs"
        >
          Boshqaruvni ko'rish uchun bosing
        </motion.div>
      )}
    </motion.div>
  );
};
