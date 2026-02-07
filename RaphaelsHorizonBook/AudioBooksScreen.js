import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Modal,
  Slider,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AudioPlayer from '../components/AudioPlayer';
import { AudioService } from '../services/AudioService';

const { width } = Dimensions.get('window');

export default function AudioBooksScreen({ navigation }) {
  const [audioBooks, setAudioBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingBook, setPlayingBook] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const scrollY = useRef(new Animated.Value(0)).current;

  const categories = [
    'All', 'Inspirational', 'Spiritual', 'Christian', 'Devotional',
    'Meditation', 'Sermons', 'Testimonies', 'Recently Added'
  ];

  useEffect(() => {
    loadAudioBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [searchQuery, selectedCategory, audioBooks]);

  const loadAudioBooks = async () => {
    setLoading(true);
    try {
      // Mock data - replace with API call
      const mockAudioBooks = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        title: [
          'The Light After the Tunnel - Audio Edition',
          'Divine Jurisprudence - Complete Audio',
          'Embracing Elegance - Guided Meditation',
          'Prayers for Breakthrough',
          'Faith Journey Audiobook',
          'Spiritual Growth Series',
          'God\'s Promises - Audio Devotional',
          'The Covenant Code Audiobook',
          'Grace and Mercy - Daily Listening',
          'Heavenly Wisdom Collection',
        ][i % 10],
        author: 'Raphael',
        narrator: 'Professional Narrator',
        description: 'Transformative audio experience for spiritual growth',
        category: ['Inspirational', 'Spiritual', 'Christian', 'Devotional'][i % 4],
        duration: `${Math.floor(Math.random() * 60) + 30}:00`,
        size: `${Math.floor(Math.random() * 500) + 100} MB`,
        rating: 4.5 + (Math.random() * 0.5),
        listenCount: Math.floor(Math.random() * 1000),
        bookmarked: Math.random() > 0.5,
        downloaded: Math.random() > 0.7,
        progress: Math.floor(Math.random() * 100),
        cover: require('../assets/images/audio-books/default.jpg'),
        audioUrl: `https://api.raphaelshorizon.com/audio/${i + 1}.mp3`,
      }));
      
      setAudioBooks(mockAudioBooks);
      setFilteredBooks(mockAudioBooks);
    } catch (error) {
      console.error('Error loading audio books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...audioBooks];
    
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }
    
    setFilteredBooks(filtered);
  };

  const handlePlay = (book) => {
    setPlayingBook(book);
    setPlayerVisible(true);
  };

  const handleDownload = async (book) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [book.id]: 0 }));
      
      const result = await AudioService.downloadAudioBook(book, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [book.id]: progress }));
      });
      
      if (result.success) {
        // Update book to show as downloaded
        const updatedBooks = audioBooks.map(b => 
          b.id === book.id ? { ...b, downloaded: true } : b
        );
        setAudioBooks(updatedBooks);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadProgress(prev => ({ ...prev, [book.id]: undefined }));
    }
  };

  const renderAudioBookItem = ({ item, index }) => {
    const translateY = scrollY.interpolate({
      inputRange: [0, 100 * index, 100 * (index + 2)],
      outputRange: [0, 0, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[styles.audioBookCard, { transform: [{ translateY }] }]}
      >
        <TouchableOpacity
          style={styles.audioBookContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AudioDetails', { book: item })}
        >
          <View style={styles.audioBookHeader}>
            <Image source={item.cover} style={styles.audioBookCover} />
            
            <View style={styles.audioBookInfo}>
              <Text style={styles.audioBookTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.audioBookAuthor}>{item.author}</Text>
              
              <View style={styles.audioBookMeta}>
                <View style={styles.metaItem}>
                  <Icon name="time-outline" size={14} color="#718096" />
                  <Text style={styles.metaText}>{item.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="headset" size={14} color="#718096" />
                  <Text style={styles.metaText}>{item.listenCount} listens</Text>
                </View>
              </View>
              
              {item.progress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${item.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{item.progress}%</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.audioBookActions}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlay(item)}
            >
              <LinearGradient
                colors={['#2d6a4f', '#3a8a66']}
                style={styles.playButtonGradient}
              >
                <Icon name="play" size={20} color="#fff" />
                <Text style={styles.playButtonText}>Play</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.actionIcon}>
                <Icon
                  name={item.bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={item.bookmarked ? '#e63946' : '#718096'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionIcon}
                onPress={() => handleDownload(item)}
              >
                {downloadProgress[item.id] !== undefined ? (
                  <>
                    <Icon name="download" size={20} color="#1a365d" />
                    <Text style={styles.downloadProgress}>
                      {downloadProgress[item.id]}%
                    </Text>
                  </>
                ) : (
                  <Icon
                    name={item.downloaded ? 'checkmark-circle' : 'download-outline'}
                    size={20}
                    color={item.downloaded ? '#2d6a4f' : '#718096'}
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionIcon}>
                <Icon name="share-outline" size={20} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[styles.header, { opacity: headerOpacity }]}
      >
        <LinearGradient
          colors={['#1a365d', '#0d1b2a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Audio Library</Text>
          <Text style={headerSubtitle}>
            Listen to inspiring teachings anytime, anywhere
          </Text>
          
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#a0aec0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search audio books..."
              placeholderTextColor="#a0aec0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </Animated.View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Now Playing Mini Player */}
      {playingBook && (
        <TouchableOpacity
          style={styles.miniPlayer}
          onPress={() => setPlayerVisible(true)}
        >
          <LinearGradient
            colors={['#2d6a4f', '#1b4332']}
            style={styles.miniPlayerGradient}
          >
            <View style={styles.miniPlayerContent}>
              <Image source={playingBook.cover} style={styles.miniPlayerCover} />
              <View style={styles.miniPlayerInfo}>
                <Text style={styles.miniPlayerTitle} numberOfLines={1}>
                  {playingBook.title}
                </Text>
                <Text style={styles.miniPlayerAuthor}>{playingBook.author}</Text>
              </View>
              <TouchableOpacity style={styles.miniPlayerButton}>
                <Icon name="pause" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniPlayerClose}
                onPress={() => setPlayingBook(null)}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Audio Books List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Loading audio books...</Text>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="headset-outline" size={80} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>No audio books found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try a different search term'
              : 'Check back soon for new audio books'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderAudioBookItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.audioBooksList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Audio Player Modal */}
      <Modal
        visible={playerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPlayerVisible(false)}
      >
        <AudioPlayer
          book={playingBook}
          onClose={() => setPlayerVisible(false)}
        />
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#2d6a4f',
  },
  categoryText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  miniPlayerGradient: {
    padding: 16,
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  miniPlayerAuthor: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  miniPlayerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  miniPlayerClose: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  audioBooksList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  audioBookCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  audioBookContainer: {
    padding: 16,
  },
  audioBookHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  audioBookCover: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  audioBookInfo: {
    flex: 1,
  },
  audioBookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
    lineHeight: 24,
  },
  audioBookAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  audioBookMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '600',
    minWidth: 35,
  },
  audioBookActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    flex: 2,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  downloadProgress: {
    fontSize: 10,
    color: '#1a365d',
    fontWeight: '600',
    marginTop: 2,
  },
});