import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Users, Calculator, Trophy, TrendingUp, Zap, Target } from 'lucide-react';

interface PlatformStats {
  total_users: number;
  total_problems_solved: number;
  total_lessons: number;
  total_courses: number;
  accuracy_rate: number;
  d7_retention: number;
  weekly_growth: number;
}

export const TractionStats = () => {
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_problems_solved: 0,
    total_lessons: 0,
    total_courses: 0,
    accuracy_rate: 0,
    d7_retention: 0,
    weekly_growth: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.rpc('get_platform_stats') as { data: any[] | null };
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    };
    fetchStats();
    setTimeout(() => setIsVisible(true), 200);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statItems = [
    {
      icon: Users,
      value: stats.total_users || 0,
      suffix: '+',
      label: 'Aktiv foydalanuvchilar',
      subtext: 'Beta foydalanuvchilar',
      gradient: 'from-blue-500 to-cyan-500',
      bgGlow: 'bg-blue-500/20',
    },
    {
      icon: Calculator,
      value: stats.total_problems_solved || 0,
      suffix: '+',
      label: "Yechilgan misollar",
      subtext: 'Jami mashqlar',
      gradient: 'from-emerald-500 to-green-500',
      bgGlow: 'bg-emerald-500/20',
    },
    {
      icon: Target,
      value: stats.accuracy_rate || 0,
      suffix: '%',
      label: "To'g'ri javob nisbati",
      subtext: "O'rtacha aniqlik",
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/20',
    },
    {
      icon: TrendingUp,
      value: stats.d7_retention || 0,
      suffix: '%',
      label: 'D7 Retention',
      subtext: '7 kunlik qaytish',
      gradient: 'from-violet-500 to-purple-500',
      bgGlow: 'bg-violet-500/20',
    },
  ];

  return (
    <Card className="p-4 sm:p-6 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex items-center gap-2">
              Traction Metrics
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-bold rounded-full">
                LIVE
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Real vaqt statistikasi</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className={`relative p-3 sm:p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] group ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 rounded-xl ${item.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity blur-xl -z-10`} />
              
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-md`}>
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className={`text-xl sm:text-2xl md:text-3xl font-display font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                  {formatNumber(item.value)}
                </span>
                <span className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                  {item.suffix}
                </span>
              </div>
              
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">{item.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{item.subtext}</p>
            </div>
          ))}
        </div>

        {/* Growth indicator */}
        <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Haftalik o'sish</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">So'nggi 7 kun</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-display font-black text-emerald-500">
                {stats.weekly_growth > 0 ? '+' : ''}{stats.weekly_growth || 0}%
              </span>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Foydalanuvchilar</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
