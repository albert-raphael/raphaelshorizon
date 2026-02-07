import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('Reader');
  const [stats, setStats] = useState({
    totalBooks: 0,
    readingTime: 0,
    bookmarks: 0,
    completed: 0,
  });
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadStats();
      loadBooks();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('@userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserName(parsedData.name || parsedData.email?.split('@')[0] || 'Reader');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AsyncStorage.getItem('@readingStats');
      if (statsData) {
        setStats(JSON.parse(statsData));
      } else {
        // Default stats
        setStats({
          totalBooks: 12,
          readingTime: 45,
          bookmarks: 8,
          completed: 3,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBooks = async () => {
    // Mock data - replace with API call
    const mockFeaturedBooks = [
      {
        id: 1,
        title: 'The Light After the Tunnel',
        author: 'Raphael',
        description: 'Discovering Your True Purpose in Hard Times',
        rating: 4.8,
        cover: require('../assets/images/books/light-after-tunnel.jpg'),
        category: 'Inspirational',
        pages: 240,
        progress: 65,
      },
      {
        id: 2,
        title: 'Divine Jurisprudence',
        author: 'Raphael',
        description: 'The Covenant Code for a Flourishing Life',
        rating: 4.9,
        cover: require('../assets/images/books/divine-jurisprudence.jpg'),
        category: 'Spiritual',
        pages: 320,
        progress: 30,
      },
      {
        id: 3,
        title: 'Embracing Elegance',
        author: 'Raphael',
        description: 'A Gentle Guide for Women',
        rating: 4.7,
        cover: require('../assets/images/books/embracing-elegance.jpg'),
        category: 'Self-Help',
        pages: 180,
        progress: 0,
      },
    ];

    setFeaturedBooks(mockFeaturedBooks);
    setRecentBooks(mockFeaturedBooks.slice(0, 2));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadStats(), loadBooks()]);
    setRefreshing(false);
  };

  const carouselData = [
    {
      id: 1,
      title: 'Premium Digital Library',
      description: 'Access thousands of books with professional reading tools',
      image: require('../assets/images/carousel/1.jpg'),
      backgroundColor: '#1a365d',
    },
    {
      id: 2,
      title: 'World-Class Reading Experience',
      description: 'Advanced features for the modern reader',
      image: require('../assets/images/carousel/2.jpg'),
      backgroundColor: '#2d6a4f',
    },
    {
      id: 3,
      title: 'Sync Across Devices',
      description: 'Continue reading anywhere, anytime',
      image: require('../assets/images/carousel/3.jpg'),
      backgroundColor: '#e63946',
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Continue Reading',
      icon: 'book',
      color: '#1a365d',
      screen: 'Library',
      badge: 2,
    },
    {
      id: 2,
      title: 'New Releases',
      icon: 'star',
      color: '#2d6a4f',
      screen: 'OnlineBooks',
    },
    {
      id: 3,
      title: 'Audio Books',
      icon: 'headset',
      color: '#e63946',
      screen: 'AudioBooks',
    },
    {
      id: 4,
      title: 'Bookmarks',
      icon: 'bookmark',
      color: '#764ba2',
      screen: 'Library',
      params: { tab: 'bookmarks' },
      badge: stats.bookmarks,
    },
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [280, 180],
    extrapolate: 'clamp',
  });

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.carouselItem, { backgroundColor: item.backgroundColor }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('OnlineBooks')}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
        style={styles.carouselGradient}
      >
        <View style={styles.carouselContent}>
          <Text style={styles.carouselTitle}>{item.title}</Text>
          <Text style={styles.carouselDescription}>{item.description}</Text>
          <View style={styles.carouselButton}>
            <Text style={styles.carouselButtonText}>Explore Now</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetails', { book: item })}
      activeOpacity={0.8}
    >
      <View style={styles.bookCoverContainer}>
        <Image source={item.cover} style={styles.bookCover} />
        {item.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
          </View>
        )}
        {item.rating >= 4.5 && (
          <View style={styles.ratingBadge}>
            <Icon name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <View style={styles.bookMeta}>
          <View style={styles.metaItem}>
            <Icon name="document-text" size={12} color="#718096" />
            <Text style={styles.metaText}>{item.pages} pages</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="bookmark" size={12} color="#718096" />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#1a365d', '#0d1b2a']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <View style={styles.userGreeting}>
            <View>
              <Text style={styles.greetingText}>Good morning,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.welcomeMessage}>
            What would you like to read today?
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a365d']}
            tintColor="#1a365d"
          />
        }
      >
        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <Carousel
            loop
            width={width - 32}
            height={200}
            autoPlay={true}
            data={carouselData}
            scrollAnimationDuration={1000}
            renderItem={renderCarouselItem}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => navigation.navigate(action.screen, action.params)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}CC`]}
                  style={styles.actionIconContainer}
                >
                  <Icon name={action.icon} size={24} color="#fff" />
                  {action.badge && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                </LinearGradient>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reading Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Reading Journey</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#1a365d', '#2d4a7d']}
                style={styles.statIconContainer}
              >
                <Icon name="book" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.totalBooks}</Text>
              <Text style={styles.statLabel}>Total Books</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#2d6a4f', '#3a8a66']}
                style={styles.statIconContainer}
              >
                <Icon name="time" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.readingTime}h</Text>
              <Text style={styles.statLabel}>Reading Time</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#e63946', '#ff6b6b']}
                style={styles.statIconContainer}
              >
                <Icon name="checkmark-circle" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Featured Books */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Books</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OnlineBooks')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksList}
          />
        </View>

        {/* Continue Reading */}
        {recentBooks.filter(book => book.progress > 0).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            {recentBooks
              .filter(book => book.progress > 0)
              .map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={styles.continueCard}
                  onPress={() => navigation.navigate('BookReader', { book })}
                >
                  <Image source={book.cover} style={styles.continueCover} />
                  <View style={styles.continueInfo}>
                    <Text style={styles.continueTitle}>{book.title}</Text>
                    <Text style={styles.continueAuthor}>{book.author}</Text>
                    <View style={styles.progressInfo}>
                      <View style={styles.progressBarFull}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${book.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>{book.progress}%</Text>
                    </View>
                    <Text style={styles.continueButton}>Continue Reading →</Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* App Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Icon name="cloud-upload" size={28} color="#1a365d" />
              </View>
              <Text style={styles.featureTitle}>Cloud Sync</Text>
              <Text style={styles.featureDescription}>
                Sync across all devices
              </Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Icon name="moon" size={28} color="#2d6a4f" />
              </View>
              <Text style={styles.featureTitle}>Dark Mode</Text>
              <Text style={styles.featureDescription}>
                Comfortable reading
              </Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Icon name="bookmark" size={28} color="#e63946" />
              </View>
              <Text style={styles.featureTitle}>Smart Bookmarks</Text>
              <Text style={styles.featureDescription}>
                Save your progress
              </Text>
            </View>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Icon name="search" size={28} color="#764ba2" />
              </View>
              <Text style={styles.featureTitle}>Advanced Search</Text>
              <Text style={styles.featureDescription}>
                Find books easily
              </Text>
            </View>
          </View>
        </View>

        {/* Donation Callout */}
        <TouchableOpacity
          style={styles.donationCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <LinearGradient
            colors={['#e63946', '#ff6b6b']}
            style={styles.donationGradient}
          >
            <View style={styles.donationContent}>
              <Icon name="heart" size={32} color="#fff" />
              <View style={styles.donationText}>
                <Text style={styles.donationTitle}>Support Our Mission</Text>
                <Text style={styles.donationDescription}>
                  Help us continue sharing God's promises through books
                </Text>
              </View>
              <Icon name="arrow-forward" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  userGreeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    color: '#a0aec0',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e63946',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeMessage: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  carouselContainer: {
    marginTop: -40,
    marginHorizontal: 16,
  },
  carouselItem: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
  },
  carouselGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  carouselContent: {
    maxWidth: '80%',
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  carouselDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  carouselButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backdropFilter: 'blur(10px)',
  },
  carouselButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
    fontSize: 14,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  seeAllText: {
    color: '#1a365d',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a365d',
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  booksList: {
    paddingRight: 10,
  },
  bookCard: {
    width: 150,
    marginRight: 16,
  },
  bookCoverContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  bookCover: {
    width: 150,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  progressContainer: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1a365d',
    borderRadius: 2,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 4,
  },
  bookInfo: {
    paddingHorizontal: 4,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: '#718096',
    marginLeft: 4,
  },
  continueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  continueCover: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  continueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  continueAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarFull: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a365d',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#1a365d',
    fontWeight: '600',
    minWidth: 35,
  },
  continueButton: {
    color: '#1a365d',
    fontWeight: '600',
    fontSize: 14,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  donationCard: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  donationGradient: {
    padding: 24,
  },
  donationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donationText: {
    flex: 1,
    marginHorizontal: 16,
  },
  donationTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  donationDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
});