import React, { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  timeframeWeeks: number;
  createdAt: string;
}

export const [SavingsProvider, useSavings] = createContextHook(() => {
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';
  const SAVINGS_GOALS_KEY = `savings_goals_${userId}`;
  
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSavingsGoals = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVINGS_GOALS_KEY);
      if (stored) {
        const goals = JSON.parse(stored);
        setSavingsGoals(goals);
      }
    } catch (error) {
      console.error('Error loading savings goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load savings goals from storage
  useEffect(() => {
    loadSavingsGoals();
  }, [loadSavingsGoals]);

  const saveSavingsGoals = async (goals: SavingsGoal[]) => {
    try {
      await AsyncStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving savings goals:', error);
    }
  };

  const addSavingsGoal = (goal: SavingsGoal) => {
    const updatedGoals = [...savingsGoals, goal];
    setSavingsGoals(updatedGoals);
    saveSavingsGoals(updatedGoals);
  };

  const updateSavingsGoal = (updatedGoal: SavingsGoal) => {
    const updatedGoals = savingsGoals.map(goal =>
      goal.id === updatedGoal.id ? updatedGoal : goal
    );
    setSavingsGoals(updatedGoals);
    saveSavingsGoals(updatedGoals);
  };

  const deleteSavingsGoal = (goalId: string) => {
    const updatedGoals = savingsGoals.filter(goal => goal.id !== goalId);
    setSavingsGoals(updatedGoals);
    saveSavingsGoals(updatedGoals);
  };

  const getSavingsGoal = (goalId: string) => {
    return savingsGoals.find(goal => goal.id === goalId);
  };

  return {
    savingsGoals,
    isLoading,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    getSavingsGoal,
  };
});
