import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth';
import { OfflineManager } from '../services/OfflineManager';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    booksRead: 0,
    readingTime: 0,
    bookmarks: 0,
    streak: 0,
  });
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    autoDownload: false,
    syncOverMobile: false,
    readingGoals: true,
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('@app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AsyncStorage.getItem('@user_stats');
      if (statsData) {
        setStats(JSON.parse(statsData));
      } else {
        // Default stats
        setStats({
          booksRead: 12,
          readingTime: 45,
          bookmarks: 8,
          streak: 7,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSettingToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('@app_settings', JSON.stringify(newSettings));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Implement account deletion
            Alert.alert(
              'Account Deletion',
              'Please contact support to delete your account.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data. Downloaded books will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await OfflineManager.clearCache();
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Subscription',
      icon: 'card',
      color: '#1a365d',
      onPress: () => navigation.navigate('Subscription'),
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      color: '#2d6a4f',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      title: 'Settings',
      icon: 'settings',
      color: '#e63946',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      color: '#764ba2',
      onPress: () => Linking.openURL('mailto:support@raphaelshorizon.com'),
    },
    {
      title: 'About',
      icon: 'information-circle',
      color: '#ff9800',
      onPress: () => navigation.navigate('About'),
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark',
      color: '#4caf50',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['#1a365d', '#0d1b2a']}
          style={styles.profileHeader}
        >
          <View style={styles.profileInfo}>
            <Image
              source={
                userData?.avatar
                  ? { uri: userData.avatar }
                  : require('../assets/images/default-avatar.jpg')
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userData?.name || 'Reader'}
              </Text>
              <Text style={styles.userEmail}>
                {userData?.email || 'reader@example.com'}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.booksRead}</Text>
              <Text style={styles.statLabel}>Books Read</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.readingTime}h</Text>
              <Text style={styles.statLabel}>Reading Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Menu</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View
                  style={[styles.menuIcon, { backgroundColor: item.color }]}
                >
                  <Icon name={item.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reading Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reading Goals</Text>
            <Switch
              value={settings.readingGoals}
              onValueChange={(value) =>
                handleSettingToggle('readingGoals', value)
              }
              trackColor={{ false: '#e2e8f0', true: '#1a365d' }}
              thumbColor="#fff"
            />
          </View>
          {settings.readingGoals && (
            <View style={styles.goalsContainer}>
              <View style={styles.goalItem}>
                <Text style={styles.goalTitle}>Daily Reading</Text>
                <Text style={styles.goalProgress}>45/60 min</Text>
                <View style={styles.goalBar}>
                  <View style={[styles.goalFill, { width: '75%' }]} />
                </View>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalTitle}>Weekly Books</Text>
                <Text style={styles.goalProgress}>2/3 books</Text>
                <View style={styles.goalBar}>
                  <View style={[styles.goalFill, { width: '66%' }]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="moon" size={24} color="#1a365d" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for reading
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) =>
                handleSettingToggle('darkMode', value)
              }
              trackColor={{ false: '#e2e8f0', true: '#1a365d' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="download" size={24} color="#2d6a4f" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Download</Text>
                <Text style={styles.settingDescription}>
                  Download new books automatically
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoDownload}
              onValueChange={(value) =>
                handleSettingToggle('autoDownload', value)
              }
              trackColor={{ false: '#e2e8f0', true: '#2d6a4f' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="cellular" size={24} color="#e63946" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sync Over Mobile</Text>
                <Text style={styles.settingDescription}>
                  Allow syncing using mobile data
                </Text>
              </View>
            </View>
            <Switch
              value={settings.syncOverMobile}
              onValueChange={(value) =>
                handleSettingToggle('syncOverMobile', value)
              }
              trackColor={{ false: '#e2e8f0', true: '#e63946' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <TouchableOpacity
            style={styles.infoItem}
            onPress={handleClearCache}
          >
            <View style={styles.infoContent}>
              <Icon name="trash" size={20} color="#718096" />
              <Text style={styles.infoText}>Clear Cache</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoContent}>
              <Icon name="star" size={20} color="#718096" />
              <Text style={styles.infoText}>Rate App</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoItem}>
            <View style={styles.infoContent}>
              <Icon name="share" size={20} color="#718096" />
              <Text style={styles.infoText}>Share App</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#a0aec0" />
          </TouchableOpacity>

          <View style={styles.appVersion}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.buildText}>Build 2024.01</Text>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Icon name="log-out" size={20} color="#e63946" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <Icon name="trash" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Raphael's Horizon Book
          </Text>
          <Text style={styles.footerTagline}>
            Unveiling God's Promises Through Boundless Possibilities
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  menuItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuText: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 16,
  },
  goalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalItem: {
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  goalProgress: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  goalBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#1a365d',
    borderRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#718096',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#2d3748',
    marginLeft: 12,
  },
  appVersion: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  versionText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#a0aec0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e63946',
  },
  logoutButtonText: {
    color: '#e63946',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#e63946',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});