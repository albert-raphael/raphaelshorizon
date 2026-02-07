import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();

  const features = [
    {
      id: 1,
      icon: 'headset',
      title: 'Premium Audio',
      description: 'High quality streaming up to 320kbps',
      color: '#3498db',
    },
    {
      id: 2,
      icon: 'sync',
      title: 'Cross-Device Sync',
      description: 'Continue listening on any device',
      color: '#9b59b6',
    },
    {
      id: 3,
      icon: 'download',
      title: 'Offline Listening',
      description: 'Download for offline enjoyment',
      color: '#2ecc71',
    },
    {
      id: 4,
      icon: 'star',
      title: 'Smart Recommendations',
      description: 'Personalized suggestions',
      color: '#e74c3c',
    },
  ];

  const stats = [
    { label: 'Audio Books', value: '1,000+' },
    { label: 'Hours', value: '5,000+' },
    { label: 'Active Listeners', value: '10,000+' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#2c3e50', '#3498db', '#9b59b6']}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Premium Audio Experience</Text>
            <Text style={styles.heroSubtitle}>
              Immerse yourself in professional audio book streaming with
              Audiobookshelf integration
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Audio')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3498db' }]}>
                <Icon name="play-circle" size={30} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Continue</Text>
              <Text style={styles.actionDesc}>3 books</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#9b59b6' }]}>
                <Icon name="trending-up" size={30} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Popular</Text>
              <Text style={styles.actionDesc}>Top 50</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#2ecc71' }]}>
                <Icon name="time" size={30} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Recent</Text>
              <Text style={styles.actionDesc}>12 new</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View
                  style={[styles.featureIcon, { backgroundColor: feature.color }]}
                >
                  <Icon name={feature.icon} size={30} color="#fff" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Listening Stats */}
        <LinearGradient
          colors={['#2c3e50', '#3498db']}
          style={styles.statsBanner}
        >
          <Text style={styles.statsTitle}>Your Listening Journey</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="time" size={40} color="#fff" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statName}>Hours</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="book" size={40} color="#fff" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statName}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="bookmark" size={40} color="#fff" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statName}>Bookmarks</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Links */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('About')}
          >
            <Icon name="information-circle" size={24} color="#3498db" />
            <Text style={styles.linkText}>About Us</Text>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Icon name="shield-checkmark" size={24} color="#3498db" />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={24} color="#3498db" />
            <Text style={styles.linkText}>Settings</Text>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  hero: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
    minWidth: 100,
    backdropFilter: 'blur(10px)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ff6b6b',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  actionDesc: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 16,
  },
  statsBanner: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 5,
  },
  statName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
  },
});

export default HomeScreen;