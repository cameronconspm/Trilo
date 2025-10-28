import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUINotifications } from '@/context/UINotificationContext';
import { SuccessNotification } from '@/components/feedback';
import { Spacing } from '@/constants/spacing';

interface NotificationContainerProps {
  children: React.ReactNode;
}

export default function NotificationContainer({ children }: NotificationContainerProps) {
  const { notifications, dismissNotification } = useUINotifications();

  return (
    <>
      {children}
      
      {/* Render notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationContainer}>
          {notifications.map(notification => (
            <SuccessNotification
              key={notification.id}
              visible={true}
              title={notification.title}
              message={notification.message}
              onDismiss={() => dismissNotification(notification.id)}
              showProgressBar={notification.showProgressBar}
              progress={notification.progress}
            />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
});
