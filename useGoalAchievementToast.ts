'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Safe hook to trigger a toast when a goal is achieved.
 * Prevents "Cannot update during render" by using useEffect and a ref guard.
 */
export function useGoalAchievementToast(goalId: string | null, goalTitle: string | null) {
  const processedGoalIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only fire if we have a goal, it's new, and hasn't been processed in this lifecycle
    if (goalId && goalTitle && processedGoalIdRef.current !== goalId) {
      processedGoalIdRef.current = goalId;
      console.trace('toast success fired: goal achievement');
      // Defer to next tick to avoid "update during render" in React 19
      setTimeout(() => {
        toast.success(`Target Achieved: ${goalTitle}! 🏆`, {
          description: 'Your trading discipline is paying off.',
          duration: 5000,
        });
      }, 0);
    }
  }, [goalId, goalTitle]);
}
