import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { getActiveSubjects } from '@/config/subjects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';

const Subjects = () => {
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const subjects = getActiveSubjects();

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Barcha fanlar</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">📚 Fanlar bo'limi</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            O'zingizga kerakli fanni tanlang va mashq qilishni boshlang!
          </p>
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card
                key={subject.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-0"
                onClick={() => navigate(subject.route)}
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${subject.gradient} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-2xl">{subject.emoji}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{subject.name}</h3>
                      <p className="text-sm text-white/80">{subject.description}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {subject.features.slice(0, 3).map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs font-medium">
                        {f}
                      </Badge>
                    ))}
                    {subject.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{subject.features.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Difficulty levels */}
                  <div className="flex items-center gap-1.5 mb-4">
                    {subject.difficultyLevels.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full bg-gradient-to-r ${subject.gradient} opacity-${20 + i * 25}`}
                        style={{ opacity: 0.2 + i * 0.25 }}
                      />
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {subject.difficultyLevels.length} daraja
                    </span>
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      Boshlash
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subjects;
