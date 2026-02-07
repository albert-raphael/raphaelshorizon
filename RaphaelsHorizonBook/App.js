import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import OnlineBooksScreen from './src/screens/books/OnlineBooksScreen';
import AudioBooksScreen from './src/screens/books/AudioBooksScreen';
import LibraryScreen from './src/screens/library/LibraryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import BookDetailsScreen from './src/screens/books/BookDetailsScreen';
import BookReaderScreen from './src/screens/books/BookReaderScreen';
import AudioPlayerScreen from './src/screens/books/AudioPlayerScreen';
import AboutScreen from './src/screens/about/AboutScreen';
import PrivacyPolicyScreen from './src/screens/about/PrivacyPolicyScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import NotificationsScreen from './src/screens/profile/NotificationsScreen';
import SubscriptionScreen from './src/screens/profile/SubscriptionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = 24;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'OnlineBooks':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'AudioBooks':
              iconName = focused ? 'headset' : 'headset-outline';
              break;
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#1a365d',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerStyle: {
          backgroundColor: '#1a365d',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'Raphaels Horizon Book',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="OnlineBooks"
        component={OnlineBooksScreen}
        options={{
          title: 'Read Online',
          headerTitle: 'Professional Book Reader',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="AudioBooks"
        component={AudioBooksScreen}
        options={{
          title: 'Audio Books',
          headerTitle: 'Audio Library',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: 'My Library',
          headerTitle: 'Personal Library',
          headerTitleAlign: 'center',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          headerTitleAlign: 'center',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      const user = await AsyncStorage.getItem('@userData');
      
      if (token && user) {
        setIsAuthenticated(true);
        setUserData(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAuthState = (authenticated, user = null) => {
    setIsAuthenticated(authenticated);
    if (user) setUserData(user);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a365d"
        translucent={false}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a365d',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerBackTitle: 'Back',
            headerTitleAlign: 'center',
            animation: 'slide_from_right',
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen
                name="Login"
                options={{ headerShown: false }}
              >
                {(props) => (
                  <LoginScreen {...props} onAuthChange={updateAuthState} />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                  title: 'Create Account',
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="BookDetails"
                component={BookDetailsScreen}
                options={{
                  title: 'Book Details',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="BookReader"
                component={BookReaderScreen}
                options={{
                  headerShown: false,
                  presentation: 'fullScreenModal',
                }}
              />
              <Stack.Screen
                name="AudioPlayer"
                component={AudioPlayerScreen}
                options={{
                  headerShown: false,
                  presentation: 'fullScreenModal',
                }}
              />
              <Stack.Screen
                name="About"
                component={AboutScreen}
                options={{
                  title: 'About Us',
                }}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{
                  title: 'Privacy Policy',
                }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  title: 'Settings',
                }}
              />
              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                  title: 'Notifications',
                }}
              />
              <Stack.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{
                  title: 'Subscription Plans',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}