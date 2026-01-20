import { useState, useCallback } from 'react';

interface LevelUpState {
  isOpen: boolean;
  newLevel: number;
  xpEarned?: number;
}

export const useLevelUpModal = () => {
  const [state, setState] = useState<LevelUpState>({
    isOpen: false,
    newLevel: 1,
    xpEarned: undefined,
  });

  const showLevelUp = useCallback((newLevel: number, xpEarned?: number) => {
    setState({
      isOpen: true,
      newLevel,
      xpEarned,
    });
  }, []);

  const hideLevelUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    newLevel: state.newLevel,
    xpEarned: state.xpEarned,
    showLevelUp,
    hideLevelUp,
  };
};
