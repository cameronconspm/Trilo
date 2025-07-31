import React, { useState, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  timeframeWeeks: number;
  createdAt: string;
}

const SAVINGS_GOALS_KEY = 'savings_goals';

export const [SavingsProvider, useSavings] = createContextHook(() => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load savings goals from storage
  useEffect(() => {
    loadSavingsGoals();
  }, []);

  const loadSavingsGoals = async () => {
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
  };

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