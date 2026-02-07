import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { OfflineManager } from '../services/OfflineManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LibraryScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('reading'); // reading, bookmarks, downloaded, history
  const [libraryData, setLibraryData] = useState({
    reading: [],
    bookmarks: [],
    downloaded: [],
    history: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [showStorageModal, setShowStorageModal] = useState(false);

  const tabs = [
    { id: 'reading', title: 'Reading Now', icon: 'book' },
    { id: 'bookmarks', title: 'Bookmarks', icon: 'bookmark' },
    { id: 'downloaded', title: 'Offline', icon: 'download' },
    { id: 'history', title: 'History', icon: 'time' },
  ];

  useEffect(() => {
    loadLibraryData();
  }, []);

  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      // Load reading progress
      const readingProgress = await AsyncStorage.getItem('@reading_progress');
      const progressData = readingProgress ? JSON.parse(readingProgress) : [];
      
      // Load bookmarks
      const bookmarks = await AsyncStorage.getItem('@bookmarks');
      const bookmarksData = bookmarks ? JSON.parse(bookmarks) : [];
      
      // Load downloaded books
      const downloadedBooks = await OfflineManager.getOfflineBooks();
      
      // Load reading history
      const history = await AsyncStorage.getItem('@reading_history');
      const historyData = history ? JSON.parse(history) : [];
      
      setLibraryData({
        reading: progressData,
        bookmarks: bookmarksData,
        downloaded: downloadedBooks,
        history: historyData,
      });

      // Load storage info
      const info = await OfflineManager.getOfflineStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLibraryData();
    setRefreshing(false);
  }, []);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your reading history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@reading_history');
            await loadLibraryData();
          },
        },
      ]
    );
  };

  const handleDeleteDownloaded = (bookId) => {
    Alert.alert(
      'Remove Book',
      'Remove this book from your device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await OfflineManager.deleteOfflineBook(bookId);
            await loadLibraryData();
          },
        },
      ]
    );
  };

  const renderReadingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => navigation.navigate('BookReader', { book: item })}
    >
      <Image source={item.cover} style={styles.bookCover} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${item.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
        <Text style={styles.lastRead}>
          Last read: {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Icon name="ellipsis-vertical" size={20} color="#718096" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderDownloadedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.libraryItem}
      onPress={() => navigation.navigate('BookReader', { book: item })}
    >
      <View style={styles.downloadedBadge}>
        <Icon name="checkmark-circle" size={16} color="#2d6a4f" />
      </View>
      <Image source={item.cover} style={styles.bookCover} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor}>{item.author}</Text>
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadSize}>
            {OfflineManager.formatBytes(item.fileSize || 0)}
          </Text>
          <Text style={styles.downloadDate}>
            Downloaded: {new Date(item.downloadedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteDownloaded(item.id)}
      >
        <Icon name="trash-outline" size={20} color="#e63946" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const emptyMessages = {
      reading: {
        title: 'No Active Reading',
        message: 'Start reading a book to see it here',
        icon: 'book-outline',
      },
      bookmarks: {
        title: 'No Bookmarks',
        message: 'Bookmark your favorite books to find them easily',
        icon: 'bookmark-outline',
      },
      downloaded: {
        title: 'No Offline Books',
        message: 'Download books to read offline',
        icon: 'download-outline',
      },
      history: {
        title: 'No Reading History',
        message: 'Your reading history will appear here',
        icon: 'time-outline',
      },
    };

    const current = emptyMessages[activeTab];

    return (
      <View style={styles.emptyContainer}>
        <Icon name={current.icon} size={80} color="#e2e8f0" />
        <Text style={styles.emptyTitle}>{current.title}</Text>
        <Text style={styles.emptyMessage}>{current.message}</Text>
        {activeTab === 'downloaded' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('OnlineBooks')}
          >
            <Text style={styles.emptyButtonText}>Browse Books</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <TouchableOpacity
          style={styles.storageButton}
          onPress={() => setShowStorageModal(true)}
        >
          <Icon name="hardware-chip" size={20} color="#1a365d" />
          {storageInfo && (
            <Text style={styles.storageText}>
              {storageInfo.formattedSize}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? '#1a365d' : '#718096'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.title}
            </Text>
            {libraryData[tab.id].length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {libraryData[tab.id].length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Library Content */}
      <FlatList
        data={libraryData[activeTab]}
        renderItem={
          activeTab === 'downloaded' ? renderDownloadedItem : renderReadingItem
        }
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.libraryList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a365d']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          libraryData[activeTab].length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {tabs.find(t => t.id === activeTab)?.title} •{' '}
                {libraryData[activeTab].length} items
              </Text>
              {activeTab === 'history' && (
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {/* Storage Modal */}
      <Modal
        visible={showStorageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStorageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Storage Management</Text>
              <TouchableOpacity onPress={() => setShowStorageModal(false)}>
                <Icon name="close" size={24} color="#2d3748" />
              </TouchableOpacity>
            </View>

            <View style={styles.storageStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {storageInfo?.count || 0}
                </Text>
                <Text style={styles.statLabel}>Books Downloaded</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {storageInfo?.formattedSize || '0 MB'}
                </Text>
                <Text style={styles.statLabel}>Storage Used</Text>
              </View>
            </View>

            <ScrollView style={styles.downloadedList}>
              {libraryData.downloaded.map((book) => (
                <View key={book.id} style={styles.downloadedListItem}>
                  <Image source={book.cover} style={styles.listItemCover} />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.listItemSize}>
                      {OfflineManager.formatBytes(book.fileSize || 0)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.listItemDelete}
                    onPress={() => handleDeleteDownloaded(book.id)}
                  >
                    <Icon name="trash-outline" size={20} color="#e63946" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  await OfflineManager.clearCache();
                  setShowStorageModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Clear Cache</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={async () => {
                  await OfflineManager.cleanupOldBooks(7);
                  await loadLibraryData();
                  setShowStorageModal(false);
                }}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  Clean Up Old Books
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  storageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  storageText: {
    color: '#1a365d',
    fontWeight: '600',
    marginLeft: 6,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  tabText: {
    color: '#718096',
    fontWeight: '500',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1a365d',
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e63946',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  libraryList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  clearText: {
    color: '#e63946',
    fontWeight: '600',
  },
  libraryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookCover: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a365d',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#1a365d',
    fontWeight: '600',
    minWidth: 35,
  },
  lastRead: {
    fontSize: 12,
    color: '#a0aec0',
  },
  downloadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  downloadSize: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '600',
  },
  downloadDate: {
    fontSize: 12,
    color: '#a0aec0',
  },
  moreButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
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
  storageStats: {
    flexDirection: 'row',
    padding: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  downloadedList: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  downloadedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listItemCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  listItemSize: {
    fontSize: 12,
    color: '#718096',
  },
  listItemDelete: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#1a365d',
  },
  modalButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});