import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  best_streak: number;
}

interface LeaderboardProps {
  currentUserId?: string;
}

export const Leaderboard = ({ currentUserId }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, username, total_score, best_streak')
        .order('total_score', { ascending: false })
        .limit(50);

      if (data) {
        setEntries(data);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
      default:
        return 'bg-secondary/50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Eng yaxshi o'yinchilar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Hali o'yinchilar yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === currentUserId;
              
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                    getRankBg(rank),
                    isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(rank)}
                    </div>
                    <div>
                      <p className={cn(
                        'font-semibold',
                        isCurrentUser && 'text-primary'
                      )}>
                        {entry.username}
                        {isCurrentUser && ' (siz)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Eng uzun seriya: {entry.best_streak}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-bold text-primary">
                      {entry.total_score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">ball</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
