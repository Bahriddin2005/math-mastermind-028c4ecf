import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { getSubjectById } from '@/config/subjects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Lock, Star } from 'lucide-react';

// Subject-specific practice components
import { SpeedReadingPractice } from '@/components/subjects/SpeedReadingPractice';
import { CalligraphyPractice } from '@/components/subjects/CalligraphyPractice';
import { LiteracyPractice } from '@/components/subjects/LiteracyPractice';
import { MultiplicationPractice } from '@/components/subjects/MultiplicationPractice';
import { useState } from 'react';

const SubjectPractice = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const subject = getSubjectById(subjectId || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Fan topilmadi</h1>
          <Button onClick={() => navigate('/subjects')}>Fanlarga qaytish</Button>
        </div>
      </div>
    );
  }

  const Icon = subject.icon;

  // If practice is selected, render the specific practice component
  if (selectedDifficulty && selectedPractice) {
    const practiceProps = {
      subjectId: subject.id,
      difficulty: selectedDifficulty,
      practiceType: selectedPractice,
      onBack: () => { setSelectedPractice(null); setSelectedDifficulty(null); },
    };

    const PracticeComponent = {
      'speed-reading': SpeedReadingPractice,
      'calligraphy': CalligraphyPractice,
      'literacy': LiteracyPractice,
      'multiplication': MultiplicationPractice,
    }[subject.id];

    if (PracticeComponent) {
      return <PracticeComponent {...practiceProps} />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subject.gradient} flex items-center justify-center`}>
            <span className="text-xl">{subject.emoji}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">{subject.description}</p>
          </div>
        </div>

        {/* Step 1: Select difficulty */}
        {!selectedDifficulty && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">📊 Daraja tanlang</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subject.difficultyLevels.map((level, i) => (
                <Card
                  key={level.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border-2 hover:border-primary/30"
                  onClick={() => setSelectedDifficulty(level.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: i + 1 }).map((_, si) => (
                          <Star key={si} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                        {level.minAge && level.maxAge && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {level.minAge}-{level.maxAge} yosh
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select practice type */}
        {selectedDifficulty && !selectedPractice && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDifficulty(null)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
              </Button>
              <Badge className={`bg-gradient-to-r ${subject.gradient} text-white`}>
                {subject.difficultyLevels.find(d => d.id === selectedDifficulty)?.label}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold">🎯 Mashq turini tanlang</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.practiceTypes.map((pt) => (
                <Card
                  key={pt.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border-2 hover:border-primary/30"
                  onClick={() => setSelectedPractice(pt.id)}
                >
                  <CardContent className="p-5 text-center">
                    <span className="text-3xl block mb-3">{pt.icon}</span>
                    <h3 className="font-bold">{pt.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{pt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubjectPractice;
