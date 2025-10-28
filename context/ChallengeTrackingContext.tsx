import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserChallenge, 
  ChallengeTemplate, 
  UserBadge, 
  UserFinancialScore, 
  ChallengeCompletion,
  AccountDataForChallenges,
  ChallengeTrackingContext,
  MicroGoal
} from '../types/finance';

const ChallengeContext = createContext<ChallengeTrackingContext | undefined>(undefined);

interface ChallengeProviderProps {
  children: React.ReactNode;
}

export function ChallengeProvider({ children }: ChallengeProviderProps) {
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeCompletion[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [financialScore, setFinancialScore] = useState<UserFinancialScore | null>(null);
  const [activeMicroGoals, setActiveMicroGoals] = useState<MicroGoal[]>([]);
  const [completedMicroGoals, setCompletedMicroGoals] = useState<MicroGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - replace with actual user ID from auth
  const userId = 'user_123';

  // Load challenge data from storage
  const loadChallengeData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load from AsyncStorage (for offline support)
      const [storedActiveChallenges, storedBadges, storedScore] = await Promise.all([
        AsyncStorage.getItem('activeChallenges'),
        AsyncStorage.getItem('userBadges'),
        AsyncStorage.getItem('financialScore')
      ]);

      if (storedActiveChallenges) {
        setActiveChallenges(JSON.parse(storedActiveChallenges));
      }
      if (storedBadges) {
        setUserBadges(JSON.parse(storedBadges));
      }
      if (storedScore) {
        setFinancialScore(JSON.parse(storedScore));
      }

      // TODO: Replace with actual API calls
      // await fetchActiveChallenges();
      // await fetchUserBadges();
      // await fetchFinancialScore();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenge data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize with empty data (no mock data)
  useEffect(() => {
    // Only initialize if no data exists in storage
    initializeEmptyData();
  }, []);

  // Load data when component mounts
  useEffect(() => {
    loadChallengeData();
  }, [loadChallengeData]);

  const initializeEmptyData = async () => {
    try {
      // Check if data already exists in storage
      const [storedActiveChallenges, storedBadges, storedScore] = await Promise.all([
        AsyncStorage.getItem('activeChallenges'),
        AsyncStorage.getItem('userBadges'),
        AsyncStorage.getItem('financialScore')
      ]);

      // Only set empty data if no data exists in storage
      if (!storedActiveChallenges) {
        setActiveChallenges([]);
        await AsyncStorage.setItem('activeChallenges', JSON.stringify([]));
      }
      if (!storedBadges) {
        setUserBadges([]);
        await AsyncStorage.setItem('userBadges', JSON.stringify([]));
      }
      if (!storedScore) {
        const emptyScore: UserFinancialScore = {
          id: 'score_001',
          user_id: userId,
          total_points: 0,
          debt_paydown_points: 0,
          savings_points: 0,
          consistency_points: 0,
          milestone_points: 0,
          current_level: 1,
          level_name: 'Beginner',
          weekly_score: 0,
          monthly_score: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        };
        setFinancialScore(emptyScore);
        await AsyncStorage.setItem('financialScore', JSON.stringify(emptyScore));
      }
    } catch (error) {
      console.error('Failed to initialize empty data:', error);
    }
  };

  // Get challenge templates
  const getChallengeTemplates = useCallback(async (): Promise<ChallengeTemplate[]> => {
    try {
      setIsLoading(true);
      
      // Mock challenge templates
      const mockTemplates: ChallengeTemplate[] = [
        {
          id: 'template_001',
          name: 'Weekly Debt Paydown',
          description: 'Pay down $100 in debt this week',
          type: 'debt_paydown',
          target_amount: 100,
          duration_days: 7,
          difficulty: 'easy',
          points_reward: 150,
          badge_reward: 'debt_buster',
          is_active: true
        },
        {
          id: 'template_002',
          name: 'Monthly Savings Goal',
          description: 'Save $500 this month',
          type: 'savings',
          target_amount: 500,
          duration_days: 30,
          difficulty: 'medium',
          points_reward: 300,
          badge_reward: 'saver_star',
          is_active: true
        },
        {
          id: 'template_003',
          name: 'Emergency Fund Builder',
          description: 'Build $1000 emergency fund',
          type: 'emergency_fund',
          target_amount: 1000,
          duration_days: 60,
          difficulty: 'hard',
          points_reward: 500,
          badge_reward: 'emergency_hero',
          is_active: true
        },
        {
          id: 'template_004',
          name: 'Spending Discipline',
          description: 'Keep weekly spending under $200',
          type: 'spending_limit',
          target_amount: 200,
          duration_days: 7,
          difficulty: 'medium',
          points_reward: 200,
          badge_reward: 'spending_wise',
          is_active: true
        }
      ];

      return mockTemplates;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch challenge templates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new challenge
  const createChallenge = useCallback(async (templateId: string, customTarget?: number) => {
    try {
      setIsLoading(true);
      
      // Get template details
      const templates = await getChallengeTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Challenge template not found');
      }

      const targetAmount = customTarget || template.target_amount;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.duration_days);

      const newChallenge: UserChallenge = {
        id: `challenge_${Date.now()}`,
        user_id: userId,
        template_id: templateId,
        challenge_name: template.name,
        description: template.description,
        type: template.type,
        target_amount: targetAmount,
        current_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        progress_percentage: 0,
        points_reward: template.points_reward,
        badge_reward: template.badge_reward
      };

      setActiveChallenges(prev => {
        const updated = [...prev, newChallenge];
        // Store in AsyncStorage with the updated array
        AsyncStorage.setItem('activeChallenges', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  }, [getChallengeTemplates]);

  // Update challenge progress based on account data
  const updateProgress = useCallback(async (accountData: AccountDataForChallenges[]) => {
    try {
      setIsLoading(true);
      
      const updatedChallenges = [...activeChallenges];
      
      for (let i = 0; i < updatedChallenges.length; i++) {
        const challenge = updatedChallenges[i];
        let progressChange = 0;
        let newCurrentAmount = challenge.current_amount;

        // Calculate progress based on challenge type and account data
        switch (challenge.type) {
          case 'debt_paydown':
            // Calculate debt reduction from credit cards and loans
            const debtAccounts = accountData.filter(account => 
              account.type === 'credit_card' || account.type === 'loan'
            );
            
            debtAccounts.forEach(account => {
              if (account.previous_balance && account.balance < account.previous_balance) {
                progressChange += account.previous_balance - account.balance;
              }
            });
            newCurrentAmount = Math.max(0, challenge.current_amount + progressChange);
            break;

          case 'savings':
          case 'emergency_fund':
            // Calculate savings increase
            const savingsAccounts = accountData.filter(account => 
              account.type === 'savings'
            );
            
            savingsAccounts.forEach(account => {
              if (account.previous_balance && account.balance > account.previous_balance) {
                progressChange += account.balance - account.previous_balance;
              }
            });
            newCurrentAmount = challenge.current_amount + progressChange;
            break;

          case 'spending_limit':
            // Calculate spending from transactions
            const checkingAccounts = accountData.filter(account => 
              account.type === 'checking'
            );
            
            checkingAccounts.forEach(account => {
              if (account.transactions) {
                const spending = account.transactions
                  .filter(t => t.amount < 0)
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                progressChange += spending;
              }
            });
            newCurrentAmount = progressChange;
            break;
        }

        // Update progress percentage
        const progressPercentage = Math.min(100, (newCurrentAmount / challenge.target_amount) * 100);
        
        updatedChallenges[i] = {
          ...challenge,
          current_amount: newCurrentAmount,
          progress_percentage: progressPercentage
        };

        // Check if challenge is completed
        if (progressPercentage >= 100 && challenge.status === 'active') {
          updatedChallenges[i].status = 'completed';
          
          // Award points and badge
          if (financialScore) {
            const newScore = {
              ...financialScore,
              total_points: financialScore.total_points + challenge.points_reward,
              weekly_score: financialScore.weekly_score + challenge.points_reward,
              monthly_score: financialScore.monthly_score + challenge.points_reward
            };
            setFinancialScore(newScore);
            await AsyncStorage.setItem('financialScore', JSON.stringify(newScore));
          }

          // Award badge if applicable
          if (challenge.badge_reward) {
            // Map challenge type to badge type
            const getBadgeType = (challengeType: string): 'debt_paydown' | 'savings' | 'consistency' | 'milestone' | 'streak' => {
              switch (challengeType) {
                case 'debt_paydown':
                  return 'debt_paydown';
                case 'savings':
                case 'emergency_fund':
                  return 'savings';
                case 'spending_limit':
                  return 'consistency';
                default:
                  return 'milestone';
              }
            };

            const newBadge: UserBadge = {
              id: `badge_${Date.now()}`,
              user_id: userId,
              badge_name: challenge.badge_reward,
              badge_type: getBadgeType(challenge.type),
              badge_description: `Earned for completing: ${challenge.challenge_name}`,
              earned_date: new Date().toISOString().split('T')[0],
              challenge_id: challenge.id,
              points_earned: challenge.points_reward
            };
            
            setUserBadges(prev => [...prev, newBadge]);
            await AsyncStorage.setItem('userBadges', JSON.stringify([...userBadges, newBadge]));
          }
        }
      }

      setActiveChallenges(updatedChallenges);
      await AsyncStorage.setItem('activeChallenges', JSON.stringify(updatedChallenges));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  }, [activeChallenges, financialScore, userBadges]);

  // Perform weekly reset
  const performWeeklyReset = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Reset weekly scores
      if (financialScore) {
        const updatedScore = {
          ...financialScore,
          weekly_score: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        };
        setFinancialScore(updatedScore);
        await AsyncStorage.setItem('financialScore', JSON.stringify(updatedScore));
      }

      // Move completed challenges to history
      const completedThisWeek = activeChallenges.filter(c => c.status === 'completed');
      setCompletedChallenges(prev => [...prev, ...completedThisWeek.map(c => ({
        id: `completion_${c.id}`,
        challenge_id: c.id,
        user_id: userId,
        start_date: c.start_date || new Date().toISOString().split('T')[0],
        completion_date: new Date().toISOString().split('T')[0],
        final_amount: c.current_amount,
        completion_percentage: c.progress_percentage,
        points_earned: c.points_reward
      }))]);

      // Remove completed challenges from active list
      setActiveChallenges(prev => prev.filter(c => c.status !== 'completed'));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform weekly reset');
    } finally {
      setIsLoading(false);
    }
  }, [activeChallenges, financialScore]);

  // Start a micro goal
  const startMicroGoal = useCallback(async (goal: MicroGoal) => {
    try {
      const activeGoal: MicroGoal = {
        ...goal,
        isActive: true,
        isCompleted: false,
        startDate: new Date().toISOString().split('T')[0],
        progress: 0,
        currentDay: 1
      };

      setActiveMicroGoals(prev => {
        const updated = [...prev, activeGoal];
        AsyncStorage.setItem('activeMicroGoals', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start micro goal');
    }
  }, []);

  // Complete a micro goal
  const completeMicroGoal = useCallback(async (goalId: string) => {
    try {
      let completedGoal: MicroGoal | undefined;
      
      setActiveMicroGoals(prev => {
        const updated = prev.filter(goal => {
          if (goal.id === goalId) {
            completedGoal = {
              ...goal,
              isActive: false,
              isCompleted: true,
              completionDate: new Date().toISOString().split('T')[0],
              progress: 100
            };
            return false; // Remove from active goals
          }
          return true;
        });
        AsyncStorage.setItem('activeMicroGoals', JSON.stringify(updated));
        return updated;
      });

      // Add to completed goals
      if (completedGoal) {
        setCompletedMicroGoals(prev => {
          const updated = [...prev, completedGoal!];
          AsyncStorage.setItem('completedMicroGoals', JSON.stringify(updated));
          return updated;
        });
      }
      
      // Award XP
      if (completedGoal && financialScore) {
        const newScore = {
          ...financialScore,
          total_points: financialScore.total_points + completedGoal.xpReward,
          weekly_score: financialScore.weekly_score + completedGoal.xpReward,
          monthly_score: financialScore.monthly_score + completedGoal.xpReward
        };
        setFinancialScore(newScore);
        await AsyncStorage.setItem('financialScore', JSON.stringify(newScore));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete micro goal');
    }
  }, [financialScore]);

  // Delete/stop a micro goal
  const deleteMicroGoal = useCallback(async (goalId: string) => {
    try {
      setActiveMicroGoals(prev => {
        const updated = prev.filter(goal => goal.id !== goalId);
        AsyncStorage.setItem('activeMicroGoals', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete micro goal');
    }
  }, []);

  // Delete/stop a challenge
  const deleteChallenge = useCallback(async (challengeId: string) => {
    try {
      setActiveChallenges(prev => {
        const updated = prev.filter(challenge => challenge.id !== challengeId);
        AsyncStorage.setItem('activeChallenges', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete challenge');
    }
  }, []);

  const value: ChallengeTrackingContext = {
    activeChallenges,
    completedChallenges,
    userBadges,
    financialScore,
    isLoading,
    error,
    createChallenge,
    updateProgress,
    getChallengeTemplates,
    performWeeklyReset,
    activeMicroGoals,
    completedMicroGoals,
    startMicroGoal,
    completeMicroGoal,
    deleteMicroGoal,
    deleteChallenge,
    loadChallengeData
  };

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallengeTracking(): ChallengeTrackingContext {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallengeTracking must be used within a ChallengeProvider');
  }
  return context;
}
