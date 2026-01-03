import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useConfetti } from './useConfetti';

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  type: 'problems' | 'streak' | 'score';
}

const achievements: Achievement[] = [
  { id: 'first10', name: 'Birinchi qadam', description: '10 ta misol yechildi!', requirement: 10, type: 'problems' },
  { id: 'solver50', name: "Faol o'quvchi", description: '50 ta misol yechildi!', requirement: 50, type: 'problems' },
  { id: 'solver100', name: 'Yuz misol', description: '100 ta misol yechildi!', requirement: 100, type: 'problems' },
  { id: 'solver500', name: 'Matematik', description: '500 ta misol yechildi!', requirement: 500, type: 'problems' },
  { id: 'solver1000', name: 'Usta', description: '1000 ta misol yechildi!', requirement: 1000, type: 'problems' },
  { id: 'streak5', name: "Boshlang'ich seriya", description: "5 ta ketma-ket to'g'ri!", requirement: 5, type: 'streak' },
  { id: 'streak10', name: "O't seriyasi", description: "10 ta ketma-ket to'g'ri!", requirement: 10, type: 'streak' },
  { id: 'streak25', name: 'Ajoyib seriya', description: "25 ta ketma-ket to'g'ri!", requirement: 25, type: 'streak' },
  { id: 'streak50', name: 'Legenda', description: "50 ta ketma-ket to'g'ri!", requirement: 50, type: 'streak' },
  { id: 'score100', name: 'Yuz ball', description: "100 ball to'plandi!", requirement: 100, type: 'score' },
  { id: 'score500', name: 'Yuqori ball', description: "500 ball to'plandi!", requirement: 500, type: 'score' },
  { id: 'score1000', name: 'Ming ball', description: "1000 ball to'plandi!", requirement: 1000, type: 'score' },
];

interface UseAchievementNotificationsProps {
  totalProblems: number;
  bestStreak: number;
  totalScore: number;
  enabled?: boolean;
}

export const useAchievementNotifications = ({
  totalProblems,
  bestStreak,
  totalScore,
  enabled = true,
}: UseAchievementNotificationsProps) => {
  const { triggerAchievementConfetti } = useConfetti();
  const previousValues = useRef<{
    problems: number;
    streak: number;
    score: number;
  }>({ problems: 0, streak: 0, score: 0 });
  
  const unlockedAchievements = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const checkAchievement = useCallback((achievement: Achievement): boolean => {
    switch (achievement.type) {
      case 'problems':
        return totalProblems >= achievement.requirement;
      case 'streak':
        return bestStreak >= achievement.requirement;
      case 'score':
        return totalScore >= achievement.requirement;
      default:
        return false;
    }
  }, [totalProblems, bestStreak, totalScore]);

  const wasUnlocked = useCallback((achievement: Achievement): boolean => {
    const prev = previousValues.current;
    switch (achievement.type) {
      case 'problems':
        return prev.problems >= achievement.requirement;
      case 'streak':
        return prev.streak >= achievement.requirement;
      case 'score':
        return prev.score >= achievement.requirement;
      default:
        return false;
    }
  }, []);

  // Initialize on first render - load from localStorage to prevent re-showing old achievements
  useEffect(() => {
    if (!initialized.current) {
      // Load previously notified achievements from localStorage
      const savedAchievements = localStorage.getItem('notified_achievements');
      if (savedAchievements) {
        try {
          const parsed = JSON.parse(savedAchievements) as string[];
          parsed.forEach(id => unlockedAchievements.current.add(id));
        } catch {
          // Ignore parse errors
        }
      }

      // Also mark currently unlocked achievements as notified (don't show old ones)
      achievements.forEach((achievement) => {
        if (checkAchievement(achievement)) {
          unlockedAchievements.current.add(achievement.id);
        }
      });
      
      // Save to localStorage
      localStorage.setItem('notified_achievements', JSON.stringify([...unlockedAchievements.current]));
      
      previousValues.current = {
        problems: totalProblems,
        streak: bestStreak,
        score: totalScore,
      };
      
      initialized.current = true;
    }
  }, [totalProblems, bestStreak, totalScore, checkAchievement]);

  useEffect(() => {
    if (!enabled || !initialized.current) return;

    // Check for newly unlocked achievements
    achievements.forEach((achievement) => {
      const isNowUnlocked = checkAchievement(achievement);
      const wasPreviouslyUnlocked = wasUnlocked(achievement);
      const alreadyNotified = unlockedAchievements.current.has(achievement.id);

      if (isNowUnlocked && !wasPreviouslyUnlocked && !alreadyNotified) {
        // New achievement unlocked!
        unlockedAchievements.current.add(achievement.id);
        
        // Save to localStorage
        localStorage.setItem('notified_achievements', JSON.stringify([...unlockedAchievements.current]));
        
        // Show notification with delay for better UX
        setTimeout(() => {
          toast.success(achievement.name, {
            description: achievement.description,
            duration: 5000,
            icon: '🏆',
          });

          // Trigger confetti
          triggerAchievementConfetti();
        }, 500);
      }
    });

    // Update previous values
    previousValues.current = {
      problems: totalProblems,
      streak: bestStreak,
      score: totalScore,
    };
  }, [totalProblems, bestStreak, totalScore, enabled, checkAchievement, wasUnlocked, triggerAchievementConfetti]);

  return {
    achievements,
    checkAchievement,
  };
};
