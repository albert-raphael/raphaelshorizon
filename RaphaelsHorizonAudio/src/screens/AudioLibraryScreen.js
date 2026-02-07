import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAudio } from '../context/AudioContext';

const AudioLibraryScreen = () => {
  const navigation = useNavigation();
  const { playAudio } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data - Replace with API call
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'recent', name: 'Recently Added' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'inspiration', name: 'Inspiration' },
    { id: 'leadership', name: 'Leadership' },
    { id: 'spiritual', name: 'Spiritual Growth' },
  ];

  const [audiobooks, setAudiobooks] = useState([
    {
      id: '1',
      title: 'The Light After the Tunnel',
      author: 'Raphael',
      duration: '5h 30m',
      coverUrl: 'https://via.placeholder.com/150',
      progress: 65,
      category: 'inspiration',
    },
    // Add more books...
  ]);

  const filteredBooks = audiobooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlay = (book) => {
    playAudio(book);
    navigation.navigate('Player');
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handlePlay(item)}
    >
      <Image source={{ uri: item.coverUrl }} style={styles.bookCover} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <Text style={styles.bookDuration}>{item.duration}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        
        <View style={styles.bookActions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlay(item)}
          >
            <Icon name="play-circle" size={24} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="bookmark-outline" size={20} color="#7f8c8d" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="download-outline" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search audiobooks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#95a5a6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryPill,
              selectedCategory === category.id && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredBooks.length}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5,000+</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>HD</Text>
          <Text style={styles.statLabel}>Quality</Text>
        </View>
      </View>

      {/* Library Header */}
      <View style={styles.libraryHeader}>
        <Text style={styles.libraryTitle}>Audiobookshelf Premium</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="filter" size={20} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="refresh" size={20} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="grid" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Books List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.booksList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="headset-outline" size={80} color="#bdc3c7" />
              <Text style={styles.emptyText}>No audiobooks found</Text>
              <Text style={styles.emptySubtext}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2c3e50',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
  },
  categoriesContent: {
    paddingRight: 15,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  categoryPillActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ecf0f1',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  libraryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
    padding: 5,
  },
  booksList: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  bookDuration: {
    fontSize: 12,
    color: '#3498db',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  bookActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: 15,
  },
  actionButton: {
    marginRight: 15,
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
});

export default AudioLibraryScreen;