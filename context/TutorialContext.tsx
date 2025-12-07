import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { TutorialService, TutorialStatus } from '@/services/TutorialService';

interface TutorialStep {
  id: string;
  tab: 'index' | 'budget' | 'banking' | 'insights' | 'profile';
  elementId?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  completeTutorial: () => Promise<void>;
  skipTutorial: () => Promise<void>;
  restartTutorial: () => Promise<void>;
  hasCompleted: boolean;
  isLoading: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'overview',
    tab: 'index',
    title: 'Overview Dashboard',
    description: 'This is your main dashboard where you can see your financial overview, weekly breakdown, and recent transactions.',
    position: 'bottom',
  },
  {
    id: 'budget',
    tab: 'budget',
    title: 'Budget Tracking',
    description: 'Track your spending by category and see how much you have left in each budget category.',
    position: 'bottom',
  },
  {
    id: 'banking',
    tab: 'banking',
    title: 'Bank Accounts',
    description: 'Connect your bank accounts to automatically sync transactions and balances.',
    position: 'bottom',
  },
  {
    id: 'insights',
    tab: 'insights',
    title: 'Insights & Challenges',
    description: 'View your financial insights, complete challenges, and earn points to level up your financial health.',
    position: 'bottom',
  },
  {
    id: 'profile',
    tab: 'profile',
    title: 'Profile & Settings',
    description: 'Manage your profile, view badges and achievements, and adjust app settings.',
    position: 'bottom',
  },
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const serviceRef = useRef<TutorialService | null>(null);

  useEffect(() => {
    if (!user) {
      serviceRef.current = null;
      setIsActive(false);
      setHasCompleted(false);
      setCurrentStep(0);
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;
    const service = new TutorialService(user.id);
    serviceRef.current = service;
    setIsLoading(true);

    const loadStatus = async () => {
      try {
        const status = await service.ensureStatus();
        if (!isSubscribed) return;
        hydrateFromStatus(status);
      } catch (error) {
        console.error('TutorialProvider: Failed to load tutorial status', error);
        if (isSubscribed) {
          setIsActive(false);
          setHasCompleted(false);
          setCurrentStep(0);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hydrateFromStatus = useCallback((status: TutorialStatus) => {
    const shouldStart = status.needs_tutorial && !status.tutorial_completed;
    setIsActive(shouldStart);
    setHasCompleted(status.tutorial_completed);
    setCurrentStep(0);
  }, []);

  const startTutorial = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      await serviceRef.current.markNeedsTutorial();
      const status = await serviceRef.current.getStatus();
      if (status) {
        hydrateFromStatus(status);
      } else {
        setIsActive(true);
        setHasCompleted(false);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('TutorialProvider: Failed to start tutorial', error);
    }
  }, [hydrateFromStatus]);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const completeTutorial = useCallback(async () => {
    try {
      if (!serviceRef.current) return;
      await serviceRef.current.markCompleted();
      setIsActive(false);
      setCurrentStep(0);
      setHasCompleted(true);
    } catch (error) {
      console.error('Failed to complete tutorial:', error);
    }
  }, []);

  const skipTutorial = useCallback(async () => {
    await completeTutorial();
  }, [completeTutorial]);

  const restartTutorial = useCallback(async () => {
    if (!serviceRef.current) return;
    try {
      await serviceRef.current.markNeedsTutorial();
      const status = await serviceRef.current.getStatus();
      if (status) {
        hydrateFromStatus(status);
      } else {
        setHasCompleted(false);
        setCurrentStep(0);
        setIsActive(true);
      }
    } catch (error) {
      console.error('TutorialProvider: Failed to restart tutorial', error);
    }
  }, [hydrateFromStatus]);

  const value: TutorialContextType = {
    isActive,
    currentStep,
    steps: TUTORIAL_STEPS,
    startTutorial,
    nextStep,
    previousStep,
    completeTutorial,
    skipTutorial,
    restartTutorial,
    hasCompleted,
    isLoading,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

