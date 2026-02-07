import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AudioLibraryScreen from '../screens/AudioLibraryScreen';
import PlayerScreen from '../screens/PlayerScreen';
import BooksScreen from '../screens/BooksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Components
import NowPlayingBar from '../components/audio/NowPlayingBar';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => {
  const { nowPlaying } = useAudio();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Audio') {
              iconName = focused ? 'headset' : 'headset-outline';
            } else if (route.name === 'Books') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Audio" component={AudioLibraryScreen} />
        <Tab.Screen name="Books" component={BooksScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      {nowPlaying && <NowPlayingBar />}
    </>
  );
};

// App Navigator
const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Player" component={PlayerScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;