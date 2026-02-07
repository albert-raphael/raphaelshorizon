import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const NetworkMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      
      if (connected !== isConnected) {
        setIsConnected(connected);
        showNotification(!connected);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const showNotification = (offline) => {
    setIsVisible(true);
    
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(offline ? 0 : 2000),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
        delay: offline ? 0 : 2000,
      }),
    ]).start(() => {
      if (!offline) {
        setIsVisible(false);
      }
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isConnected ? '#2d6a4f' : '#e63946',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Icon
        name={isConnected ? 'wifi' : 'cloud-offline'}
        size={20}
        color="#fff"
      />
      <Text style={styles.text}>
        {isConnected ? 'Back Online' : 'You are offline'}
      </Text>
      {!isConnected && (
        <Text style={styles.subText}>Some features may be limited</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginLeft: 8,
  },
});

// Usage in App.js:
// Add <NetworkMonitor /> after NavigationContainer