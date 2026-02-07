import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Context Providers
import { AuthProvider } from './src/context/AuthContext';
import { AudioProvider } from './src/context/AudioContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Loading Component
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <ThemeProvider>
            <AuthProvider>
              <AudioProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <AppNavigator />
                </NavigationContainer>
              </AudioProvider>
            </AuthProvider>
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}