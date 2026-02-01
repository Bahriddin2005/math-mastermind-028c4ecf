import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Minus, Plus, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InteractiveAbacus } from '@/components/InteractiveAbacus';
import { cn } from '@/lib/utils';

const AbacusSimulator = () => {
  const [columns, setColumns] = useState(3);
  const [value, setValue] = useState(0);

  const handleReset = () => {
    setValue(0);
  };

  const adjustColumns = (delta: number) => {
    const newColumns = Math.max(1, Math.min(5, columns + delta));
    setColumns(newColumns);
    // Qiymatni yangi ustunlar soniga moslashtirish
    const maxValue = Math.pow(10, newColumns) - 1;
    if (value > maxValue) {
      setValue(maxValue);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Orqaga</span>
          </Link>
          
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Abakus Simulator
          </h1>
          
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Sozlamalar */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              Sozlamalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ustunlar soni:</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustColumns(-1)}
                  disabled={columns <= 1}
                  className="w-8 h-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-bold text-lg">{columns}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustColumns(1)}
                  disabled={columns >= 5}
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Ustunlar nomlari */}
            <div className="mt-3 flex justify-center gap-2">
              {Array.from({ length: columns }).reverse().map((_, i) => {
                const colIndex = columns - 1 - i;
                const labels = ['Birlik', "O'nlik", 'Yuzlik', 'Minglik', "O'n minglik"];
                return (
                  <span 
                    key={colIndex}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      colIndex === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {labels[colIndex]}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Abakus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <InteractiveAbacus
            columns={columns}
            value={value}
            onChange={setValue}
            showValue={true}
          />
        </motion.div>

        {/* Qo'llanma */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Foydalanish
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Tap/Click</strong> - boncukni yoqish/o'chirish</li>
              <li>• <strong>Swipe yuqoriga</strong> - boncukni faollashtirish</li>
              <li>• <strong>Swipe pastga</strong> - boncukni o'chirish</li>
              <li>• <strong>Qizil boncuk</strong> - 5 qiymat</li>
              <li>• <strong>Yashil boncuk</strong> - 1 qiymat</li>
            </ul>
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
  );
};

export default AbacusSimulator;
