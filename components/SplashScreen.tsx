import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={
          Platform.OS === 'web'
            ? { uri: '/assets/images/splash-icon.png' }
            : require('../assets/images/splash-icon.png')
        }
        style={styles.image}
        resizeMode='contain'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E91F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
    maxWidth: 300,
    maxHeight: 300,
  },
});
