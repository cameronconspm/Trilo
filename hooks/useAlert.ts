import { useState, useCallback } from 'react';

interface AlertAction {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions: AlertAction[];
}

interface AlertState extends AlertOptions {
  visible: boolean;
}

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    actions: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert,
  };
}