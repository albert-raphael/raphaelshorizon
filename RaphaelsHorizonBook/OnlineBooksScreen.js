import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  Dimensions,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function OnlineBooksScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const categories = [
    'All', 'Inspirational', 'Spiritual', 'Self-Help', 'Christian',
    'Biography', 'Devotional', 'Fiction', 'Non-Fiction', 'Recently Added'
  ];

  const filters = {
    format: ['EPUB', 'PDF', 'MOBI', 'All'],
    language: ['English', 'German', 'French', 'All'],
    sortBy: ['Popularity', 'Newest', 'Title', 'Rating'],
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [searchQuery, selectedCategory, books]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      // Mock data - replace with API call
      const mockBooks = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: [
          'The Light After the Tunnel',
          'Divine Jurisprudence',
          'Embracing Elegance',
          'The Power of Prayer',
          'Faith Journey',
          'Spiritual Growth',
          'God\'s Promises',
          'The Covenant Code',
          'Grace and Mercy',
          'Heavenly Wisdom',
        ][i % 10],
        author: 'Raphael',
        description: 'Transformative book for spiritual growth and purpose',
        category: ['Inspirational', 'Spiritual', 'Self-Help', 'Christian'][i % 4],
        rating: 4.5 + (Math.random() * 0.5),
        pages: 150 + Math.floor(Math.random() * 200),
        language: ['English', 'German'][Math.floor(Math.random() * 2)],
        format: ['EPUB', 'PDF', 'MOBI'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 100),
        bookmarked: Math.random() > 0.5,
        featured: i < 5,
        cover: require('../assets/images/books/default.jpg'),
      }));
      
      setBooks(mockBooks);
      setFilteredBooks(mockBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }
    
    setFilteredBooks(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const renderBookItem = ({ item, index }) => {
    const translateY = scrollY.interpolate({
      inputRange: [0, 100 * index, 100 * (index + 2)],
      outputRange: [0, 0, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          viewMode === 'grid' ? styles.bookCardGrid : styles.bookCardList,
          { transform: [{ translateY }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BookDetails', { book: item })}
        >
          <View style={styles.bookContainer}>
            <View style={styles.bookCoverWrapper}>
              <Image source={item.cover} style={styles.bookCover} />
              {item.featured && (
                <LinearGradient
                  colors={['#e63946', '#ff6b6b']}
                  style={styles.featuredBadge}
                >
                  <Text style={styles.featuredText}>Featured</Text>
                </LinearGradient>
              )}
              {item.progress > 0 && (
                <View style={styles.progressWrapper}>
                  <View style={styles.progressBackground} />
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.progress}%` },
                    ]}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.bookInfo}>
              <View style={styles.bookHeader}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <TouchableOpacity>
                  <Icon
                    name={item.bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={item.bookmarked ? '#e63946' : '#718096'}
                  />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.bookAuthor}>{item.author}</Text>
              
              <View style={styles.bookMeta}>
                <View style={styles.metaItem}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="document-text" size={14} color="#718096" />
                  <Text style={styles.metaText}>{item.pages} pages</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="globe" size={14} color="#718096" />
                  <Text style={styles.metaText}>{item.language}</Text>
                </View>
              </View>
              
              <Text style={styles.bookDescription} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.bookActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('BookReader', { book: item })}
                >
                  <LinearGradient
                    colors={['#1a365d', '#2d4a7d']}
                    style={styles.readButton}
                  >
                    <Icon name="book" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Read</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.iconButton}>
                  <Icon name="share-outline" size={20} color="#718096" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.iconButton}>
                  <Icon name="download-outline" size={20} color="#718096" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (showWebView) {
    return (
      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
        visible={showWebView}
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowWebView(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Calibre-Web Library</Text>
          </View>
          <WebView
            source={{ uri: 'https://raphaelshorizon.com/calibre/' }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#1a365d" />
                <Text style={styles.loadingText}>Loading Calibre-Web...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#1a365d', '#0d1b2a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Professional Book Reader</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                <Icon
                  name={viewMode === 'grid' ? 'list' : 'grid'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowWebView(true)}
              >
                <Icon name="globe" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#a0aec0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, authors, keywords..."
              placeholderTextColor="#a0aec0"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="#a0aec0" />
              </TouchableOpacity>
            )}
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

      {/* Filters Bar */}
      <View style={styles.filtersBar}>
        <Text style={styles.resultsText}>
          {filteredBooks.length} Books Available
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter" size={20} color="#1a365d" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Books List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="book-outline" size={80} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>No books found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try a different search term'
              : 'No books available in this category'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={clearFilters}
          >
            <Text style={styles.emptyButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id.toString()}
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.booksList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* Filters Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Books</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color="#2d3748" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Add filter options here */}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={clearFilters}
              >
                <Text style={styles.modalButtonTextSecondary}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.modalButtonTextPrimary}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('BookReader')}
      >
        <LinearGradient
          colors={['#1a365d', '#2d4a7d']}
          style={styles.fabGradient}
        >
          <Icon name="book" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
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
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 12,
    padding: 8,
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
    backgroundColor: '#1a365d',
  },
  categoryText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filtersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterButtonText: {
    color: '#1a365d',
    fontWeight: '600',
    marginLeft: 8,
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
  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  booksList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bookCardGrid: {
    width: '48%',
    margin: '1%',
  },
  bookCardList: {
    width: '100%',
    marginBottom: 16,
  },
  bookContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCoverWrapper: {
    position: 'relative',
  },
  bookCover: {
    width: '100%',
    height: 200,
    backgroundColor: '#e2e8f0',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a365d',
  },
  bookInfo: {
    padding: 16,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  bookMeta: {
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
  bookDescription: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  bookActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginRight: 8,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginLeft: 8,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
  },
  backButton: {
    padding: 8,
  },
  webViewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalBody: {
    padding: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  modalButtonPrimary: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1a365d',
  },
  modalButtonTextSecondary: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});