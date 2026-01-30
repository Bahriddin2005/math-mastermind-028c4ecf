import { Card } from './ui/card';
import { 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  DollarSign, 
  BarChart3,
  Rocket,
  Shield,
  Globe
} from 'lucide-react';

export const InvestorHighlights = () => {
  const highlights = [
    {
      icon: '🎯',
      title: 'Value Proposition',
      description: '7 kunda +25% hisoblash tezligi (pilot: 120 o\'quvchi)',
      gradient: 'from-emerald-500/10 to-green-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: '💰',
      title: 'Monetizatsiya',
      description: 'Freemium + Premium obunalar (B2C) + Maktab lisensiyalari (B2B)',
      gradient: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: '📊',
      title: 'Key Metrics',
      description: 'D7 Retention 38% • O\'rtacha sessiya 12 daqiqa • NPS 72',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: '🚀',
      title: 'Growth Strategy',
      description: 'Organik + Referral tizimi + Maktab hamkorliklari',
      gradient: 'from-violet-500/10 to-purple-500/10',
      borderColor: 'border-violet-500/30',
    },
  ];

  const competitiveAdvantages = [
    { icon: CheckCircle2, text: 'Gamification (XP, Level, Badges) - bola motivatsiyasi' },
    { icon: CheckCircle2, text: 'Real-time Ota-ona dashboard - kuzatuv' },
    { icon: CheckCircle2, text: 'AI-based adaptive qiyinlik - personalizatsiya' },
    { icon: CheckCircle2, text: 'O\'qituvchi tools - sinf boshqaruvi' },
    { icon: CheckCircle2, text: 'O\'zbek tilida #1 - bozor ustunligi' },
  ];

  return (
    <Card className="p-4 sm:p-6 border-primary/20 bg-gradient-to-br from-card via-card to-accent/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Nima uchun IQROMAX?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Investorlar uchun qisqacha</p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {highlights.map((item, index) => (
          <div 
            key={index}
            className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.borderColor} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-foreground mb-0.5">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Competitive Advantages */}
      <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border/50">
        <h4 className="text-sm sm:text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Raqobatbardosh ustunliklar
        </h4>
        <ul className="space-y-2">
          {competitiveAdvantages.map((advantage, index) => (
            <li key={index} className="flex items-start gap-2">
              <advantage.icon className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground">{advantage.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Market Size */}
      <div className="mt-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">O'zbekiston EdTech bozori</p>
              <p className="text-xs text-muted-foreground">Target: 5-14 yosh, 6M+ bolalar</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-display font-black text-primary">$50M+</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">TAM (2025)</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
