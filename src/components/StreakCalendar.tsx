import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Star,
  Trophy,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface DayActivity {
  date: string;
  problems_solved: number;
  score: number;
  sessions: number;
}

interface StreakCalendarProps {
  className?: string;
  compact?: boolean;
}

export const StreakCalendar = ({ className, compact = false }: StreakCalendarProps) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activityData, setActivityData] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);

  // Fetch activity data for the current month
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchActivityData = async () => {
      setLoading(true);
      
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      try {
        // Fetch game sessions for this month
        const { data: sessions, error } = await supabase
          .from('game_sessions')
          .select('created_at, correct, incorrect, score')
          .eq('user_id', user.id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (error) throw error;

        // Group by date
        const activityMap = new Map<string, DayActivity>();
        
        sessions?.forEach(session => {
          const dateKey = session.created_at.split('T')[0];
          const existing = activityMap.get(dateKey);
          
          if (existing) {
            existing.problems_solved += (session.correct || 0) + (session.incorrect || 0);
            existing.score += session.score || 0;
            existing.sessions += 1;
          } else {
            activityMap.set(dateKey, {
              date: dateKey,
              problems_solved: (session.correct || 0) + (session.incorrect || 0),
              score: session.score || 0,
              sessions: 1,
            });
          }
        });

        setActivityData(Array.from(activityMap.values()));
        setTotalActiveDays(activityMap.size);

        // Fetch profile for streak info
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, best_streak')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setCurrentStreak(profile.current_streak || 0);
          setBestStreak(profile.best_streak || 0);
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [user, currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Get activity for a specific day
  const getDayActivity = (date: Date): DayActivity | undefined => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return activityData.find(a => a.date === dateKey);
  };

  // Get intensity level for styling (0-4)
  const getIntensityLevel = (activity: DayActivity | undefined): number => {
    if (!activity) return 0;
    if (activity.problems_solved >= 30) return 4;
    if (activity.problems_solved >= 20) return 3;
    if (activity.problems_solved >= 10) return 2;
    if (activity.problems_solved >= 1) return 1;
    return 0;
  };

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const weekDays = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

  // Intensity colors
  const intensityColors = [
    'bg-muted/30 dark:bg-muted/20', // 0 - no activity
    'bg-emerald-200 dark:bg-emerald-900/50', // 1 - low
    'bg-emerald-400 dark:bg-emerald-700/70', // 2 - medium
    'bg-emerald-500 dark:bg-emerald-600', // 3 - high
    'bg-emerald-600 dark:bg-emerald-500', // 4 - very high
  ];

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Seriya: {currentStreak} kun</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Eng yaxshi: {bestStreak}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {/* Mini streak visualization */}
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const activity = getDayActivity(date);
              const intensity = getIntensityLevel(activity);
              
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 aspect-square rounded-sm transition-all',
                    intensityColors[intensity],
                    isToday(date) && 'ring-2 ring-primary ring-offset-1'
                  )}
                  title={`${format(date, 'MMM d')}: ${activity?.problems_solved || 0} masala`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>7 kun oldin</span>
            <span>Bugun</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Faollik Kalendari</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Kunlik mashq tarixi
              </p>
            </div>
          </CardTitle>
          
          {/* Stats badges */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              <Flame className="h-3 w-3" />
              {currentStreak} kun
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3 text-amber-500" />
              {bestStreak}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold text-sm">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goToNextMonth} 
            className="h-8 w-8"
            disabled={isSameMonth(currentMonth, new Date())}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const activity = getDayActivity(date);
            const intensity = getIntensityLevel(activity);
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={cn(
                  'relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all group cursor-pointer',
                  intensityColors[intensity],
                  !isCurrentMonth && 'opacity-30',
                  isTodayDate && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  intensity > 0 && 'hover:scale-110 hover:shadow-md'
                )}
              >
                <span className={cn(
                  'text-xs font-medium',
                  intensity >= 3 ? 'text-white' : 'text-foreground',
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(date, 'd')}
                </span>
                
                {/* Activity indicator */}
                {activity && activity.problems_solved > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {intensity >= 2 && <Star className={cn('h-2 w-2', intensity >= 3 ? 'text-white' : 'text-amber-500')} />}
                    {intensity >= 4 && <Sparkles className="h-2 w-2 text-white" />}
                  </div>
                )}

                {/* Tooltip on hover */}
                {activity && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 text-xs">
                    <p className="font-bold mb-1">{format(date, 'd MMMM')}</p>
                    <p className="text-muted-foreground">
                      {activity.problems_solved} masala • {activity.score} ball
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Kam</span>
            {intensityColors.map((color, i) => (
              <div
                key={i}
                className={cn('w-4 h-4 rounded-sm', color)}
              />
            ))}
            <span>Ko'p</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Bu oy: <span className="font-semibold text-foreground">{totalActiveDays}</span> kun faol
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
