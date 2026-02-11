import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface Props {
  subjectId: string;
  difficulty: string;
  practiceType: string;
  onBack: () => void;
}

const LETTERS: Record<string, string[]> = {
  beginner: ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
  elementary: ['Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z', 'O\'', 'G\'', 'Sh', 'Ch', 'Ng'],
  intermediate: ['Oila', 'Maktab', 'Kitob', 'Tabiat', 'Vatan', 'Do\'st', 'Bahor', 'Quyosh'],
};

export const CalligraphyPractice = ({ difficulty, practiceType, onBack }: Props) => {
  const { soundEnabled, toggleSound } = useSound();
  const items = LETTERS[difficulty] || LETTERS.beginner;
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">✍️ Husni Xat</h1>
          <Badge variant="outline">{practiceType}</Badge>
        </div>

        <Card>
          <CardContent className="p-8 text-center space-y-6">
            {/* Large letter display */}
            <div className="bg-muted/30 rounded-2xl p-8 border-2 border-dashed border-muted-foreground/20">
              <p className="text-8xl md:text-9xl font-serif font-bold text-primary leading-none">
                {items[currentIndex]}
              </p>
            </div>

            {/* Writing area hint */}
            <div className="bg-muted/20 rounded-xl p-6 border border-muted-foreground/10">
              <div className="space-y-3">
                {[1, 2, 3].map(line => (
                  <div key={line} className="h-12 border-b-2 border-dashed border-muted-foreground/20 relative">
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 border-b border-muted-foreground/10" style={{ bottom: '33%' }} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                📝 Qog'ozda yozing va ko'rsatmaga rioya qiling
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                ← Oldingi
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                {currentIndex + 1} / {items.length}
              </span>
              <Button
                onClick={() => setCurrentIndex(i => Math.min(items.length - 1, i + 1))}
                disabled={currentIndex === items.length - 1}
              >
                Keyingi →
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
