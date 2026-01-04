import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GameCurrency {
  coins: number;
  lives: number;
  maxLives: number;
  lastLifeRegen: Date;
}

export const useGameCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<GameCurrency>({
    coins: 0,
    lives: 5,
    maxLives: 5,
    lastLifeRegen: new Date()
  });
  const [loading, setLoading] = useState(true);

  // Life regeneration interval (5 minutes)
  const LIFE_REGEN_INTERVAL = 5 * 60 * 1000;

  const loadCurrency = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_game_currency')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Calculate regenerated lives
        const lastRegen = new Date(data.last_life_regen);
        const now = new Date();
        const timeDiff = now.getTime() - lastRegen.getTime();
        const livesToAdd = Math.floor(timeDiff / LIFE_REGEN_INTERVAL);
        const newLives = Math.min(data.lives + livesToAdd, data.max_lives);

        if (livesToAdd > 0 && newLives > data.lives) {
          // Update lives in database
          await supabase
            .from('user_game_currency')
            .update({ 
              lives: newLives, 
              last_life_regen: now.toISOString() 
            })
            .eq('user_id', user.id);
        }

        setCurrency({
          coins: data.coins,
          lives: newLives,
          maxLives: data.max_lives,
          lastLifeRegen: now
        });
      } else {
        // Create initial currency record
        const { data: newData, error: insertError } = await supabase
          .from('user_game_currency')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;

        setCurrency({
          coins: newData.coins,
          lives: newData.lives,
          maxLives: newData.max_lives,
          lastLifeRegen: new Date(newData.last_life_regen)
        });
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  // Life regeneration timer
  useEffect(() => {
    if (!user || currency.lives >= currency.maxLives) return;

    const interval = setInterval(() => {
      setCurrency(prev => {
        if (prev.lives >= prev.maxLives) return prev;
        return { ...prev, lives: prev.lives + 1, lastLifeRegen: new Date() };
      });
    }, LIFE_REGEN_INTERVAL);

    return () => clearInterval(interval);
  }, [user, currency.lives, currency.maxLives]);

  const addCoins = useCallback(async (amount: number) => {
    if (!user) return;

    const newCoins = currency.coins + amount;
    setCurrency(prev => ({ ...prev, coins: newCoins }));

    await supabase
      .from('user_game_currency')
      .update({ coins: newCoins })
      .eq('user_id', user.id);
  }, [user, currency.coins]);

  const spendCoins = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || currency.coins < amount) return false;

    const newCoins = currency.coins - amount;
    setCurrency(prev => ({ ...prev, coins: newCoins }));

    await supabase
      .from('user_game_currency')
      .update({ coins: newCoins })
      .eq('user_id', user.id);

    return true;
  }, [user, currency.coins]);

  const useLife = useCallback(async (): Promise<boolean> => {
    if (!user || currency.lives <= 0) return false;

    const newLives = currency.lives - 1;
    setCurrency(prev => ({ ...prev, lives: newLives }));

    await supabase
      .from('user_game_currency')
      .update({ lives: newLives, last_life_regen: new Date().toISOString() })
      .eq('user_id', user.id);

    return true;
  }, [user, currency.lives]);

  const addLife = useCallback(async () => {
    if (!user || currency.lives >= currency.maxLives) return;

    const newLives = currency.lives + 1;
    setCurrency(prev => ({ ...prev, lives: newLives }));

    await supabase
      .from('user_game_currency')
      .update({ lives: newLives })
      .eq('user_id', user.id);
  }, [user, currency.lives, currency.maxLives]);

  return {
    ...currency,
    loading,
    addCoins,
    spendCoins,
    useLife,
    addLife,
    refresh: loadCurrency
  };
};
