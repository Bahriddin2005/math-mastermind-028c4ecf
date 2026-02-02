import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Minus, Plus, Calculator, Settings2, Volume2, VolumeX, Smartphone, Monitor, Maximize2 } from 'lucide-react';
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

const AbacusSimulator = () => {
  const [columns, setColumns] = useState(13);
  const [value, setValue] = useState(0);
  const [mode, setMode] = useState<AbacusMode>('beginner');
  const [orientation, setOrientation] = useState<AbacusOrientation>('horizontal');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { soundEnabled, toggleSound } = useSound();

  const handleReset = useCallback(() => {
    setValue(0);
  }, []);

  // Min: 3, Max: 17 ustun
  const adjustColumns = useCallback((delta: number) => {
    const newColumns = Math.max(3, Math.min(17, columns + delta));
    setColumns(newColumns);
    // Qiymatni yangi ustunlar soniga moslashtirish
    const maxValue = Math.pow(10, newColumns) - 1;
    setValue(prev => Math.min(prev, maxValue));
  }, [columns]);

  // Kengaytirilgan ustun nomlari (17 tagacha)
  const columnLabels = [
    'Birlik', "O'nlik", 'Yuzlik', 'Minglik', "O'n minglik", "Yuz minglik",
    'Million', "O'n mln", "Yuz mln", 'Milliard', "O'n mlrd", "Yuz mlrd",
    'Trillion', "O'n trln", "Yuz trln", "Ming trln", "O'n ming trln"
  ];

  return (
    <>
      {/* Fullscreen Abacus Modal */}
      <FullscreenAbacus
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        initialColumns={columns}
        initialValue={value}
        initialMode={mode}
      />

      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Orqaga</span>
          </Link>
          
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline">Abakus Simulator</span>
            <span className="sm:hidden">Abakus</span>
          </h1>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSound}
              className="w-9 h-9 p-0"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className={cn("w-9 h-9 p-0", showSettings && "bg-primary/10")}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset} 
              className="gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Rejim tanlash */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AbacusModeSelector mode={mode} onChange={setMode} />
        </motion.div>

        {/* Sozlamalar paneli */}
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
                {/* Ustunlar soni */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ustunlar soni:</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustColumns(-1)}
                      disabled={columns <= 3}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-bold text-lg">{columns}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => adjustColumns(1)}
                      disabled={columns >= 17}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Yo'nalish tanlash */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yo'nalish:</span>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={orientation === 'horizontal' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOrientation('horizontal')}
                      className="h-8 px-3 gap-1.5"
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Gorizontal</span>
                    </Button>
                    <Button
                      variant={orientation === 'vertical' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setOrientation('vertical')}
                      className="h-8 px-3 gap-1.5"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Vertikal</span>
                    </Button>
                  </div>
                </div>
                
                {/* Ustunlar nomlari */}
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: columns }).reverse().map((_, i) => {
                    const colIndex = columns - 1 - i;
                    return (
                      <span 
                        key={colIndex}
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          colIndex === 0 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
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

        {/* Abakus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          {/* Fullscreen tugmasi */}
          <div className="flex justify-center gap-2 mb-3">
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
          
          {/* Abakus komponenti */}
          <div className={cn(
            "flex justify-center py-4",
            orientation === 'vertical' && "min-h-[400px] items-center"
          )}>
            <RealisticAbacus
              columns={columns}
              value={value}
              onChange={setValue}
              mode={mode}
              showValue={mode !== 'mental'}
              orientation={orientation}
            />
          </div>
        </motion.div>

        {/* Qo'llanma */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Soroban Abakus Qoidalari
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">Toshlar harakati:</p>
                <ul className="space-y-1">
                  <li>• <strong>Drag</strong> - toshni yuqoriga/pastga suring</li>
                  <li>• <strong>Tap/Click</strong> - toshni almashtirish</li>
                  <li>• Tosh avtomatik joyiga tushadi (snap)</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-medium text-foreground">Qiymatlar:</p>
                <ul className="space-y-1">
                  <li>• <span className="text-red-500 font-bold">Qizil tosh</span> = 5 qiymat</li>
                  <li>• <span className="text-emerald-500 font-bold">Yashil tosh</span> = 1 qiymat</li>
                  <li>• Faqat chiziqqa tegib turgan tosh aktiv</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amaliyotga o'tish */}
        <Card className="bg-gradient-to-r from-accent/20 to-primary/20 border-primary/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Abakus bilan mashq qiling!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Interaktiv misollar bilan o'rganing
                </p>
              </div>
              <Link to="/abacus-practice">
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  Boshlash
                  <span className="text-lg">→</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
};

export default AbacusSimulator;
