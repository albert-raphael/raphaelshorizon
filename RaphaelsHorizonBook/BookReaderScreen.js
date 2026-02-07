import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import { OfflineManager } from '../services/OfflineManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function BookReaderScreen({ route, navigation }) {
  const { book } = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(book.pages || 300);
  const [showControls, setShowControls] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('light');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [bookContent, setBookContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    loadBook();
    setupAutoHideControls();
    
    return () => {
      saveReadingProgress();
    };
  }, []);

  useEffect(() => {
    if (showControls) {
      Animated.timing(controlsAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(controlsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showControls]);

  const loadBook = async () => {
    try {
      const isDownloaded = await OfflineManager.isBookDownloaded(book.id);
      setIsOffline(isDownloaded);
      
      if (isDownloaded) {
        const offlineBook = await OfflineManager.getOfflineBook(book.id);
        // Load book from local file
        // For EPUB, you would need an EPUB reader library
        setBookContent(`
          <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, sans-serif;
                  font-size: ${fontSize}px;
                  line-height: ${lineHeight};
                  padding: 40px 20px;
                  color: ${theme === 'dark' ? '#fff' : '#000'};
                  background-color: ${theme === 'dark' ? '#1a202c' : '#fff'};
                  max-width: 800px;
                  margin: 0 auto;
                }
                h1 { font-size: 2em; margin-bottom: 20px; }
                h2 { font-size: 1.5em; margin: 15px 0; }
                p { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>${book.title}</h1>
              <h2>by ${book.author}</h2>
              <p>${book.description}</p>
              <!-- Book content would be loaded here -->
            </body>
          </html>
        `);
      } else {
        // Load from online source
        setBookContent(`
          <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, sans-serif;
                  font-size: ${fontSize}px;
                  line-height: ${lineHeight};
                  padding: 40px 20px;
                  color: ${theme === 'dark' ? '#fff' : '#000'};
                  background-color: ${theme === 'dark' ? '#1a202c' : '#fff'};
                  max-width: 800px;
                  margin: 0 auto;
                }
              </style>
            </head>
            <body>
              <iframe 
                src="${book.readUrl || `https://raphaelshorizon.com/books/${book.id}`}"
                style="width: 100%; height: 100vh; border: none;"
              ></iframe>
            </body>
          </html>
        `);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading book:', error);
    }
  };

  const setupAutoHideControls = () => {
    const timer = setTimeout(() => {
      if (showControls) {
        setShowControls(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  };

  const saveReadingProgress = async () => {
    const progress = Math.round((currentPage / totalPages) * 100);
    await OfflineManager.saveReadingProgressLocally(
      book.id,
      progress,
      currentPage,
      'Chapter 1' // This should be dynamic
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
    saveReadingProgress();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    loadBook(); // Reload with new theme
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    loadBook(); // Reload with new font size
  };

  const handleLineHeightChange = (height) => {
    setLineHeight(height);
    loadBook(); // Reload with new line height
  };

  const renderControls = () => {
    const opacity = controlsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const translateY = controlsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-50, 0],
    });

    return (
      <Animated.View
        style={[
          styles.controls,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              saveReadingProgress();
              navigation.goBack();
            }}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {book.title}
            </Text>
            <Text style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </Text>
          </View>
          
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowChapters(true)}
            >
              <Icon name="list" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSettings(true)}
            >
              <Icon name="settings" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="bookmark-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <Icon
              name="chevron-back"
              size={30}
              color={currentPage <= 1 ? '#666' : '#fff'}
            />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={totalPages}
              value={currentPage}
              onValueChange={setCurrentPage}
              onSlidingComplete={handlePageChange}
              minimumTrackTintColor="#2d6a4f"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#2d6a4f"
            />
            <View style={styles.pageControls}>
              <Text style={styles.pageText}>{currentPage}</Text>
              <Text style={styles.pageSeparator}>/</Text>
              <Text style={styles.pageText}>{totalPages}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <Icon
              name="chevron-forward"
              size={30}
              color={currentPage >= totalPages ? '#666' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderSettings = () => (
    <Modal
      visible={showSettings}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSettings(false)}
    >
      <View style={styles.settingsOverlay}>
        <Animated.View
          style={[
            styles.settingsPanel,
            { transform: [{ translateY: settingsAnim }] },
          ]}
        >
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Reading Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Icon name="close" size={24} color="#2d3748" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            {/* Theme Selection */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Theme</Text>
              <View style={styles.themeButtons}>
                {['light', 'sepia', 'dark'].map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption}
                    style={[
                      styles.themeButton,
                      theme === themeOption && styles.themeButtonActive,
                    ]}
                    onPress={() => handleThemeChange(themeOption)}
                  >
                    <View
                      style={[
                        styles.themePreview,
                        { backgroundColor: getThemeColor(themeOption) },
                      ]}
                    />
                    <Text style={styles.themeText}>
                      {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Font Size */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Font Size</Text>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity
                  style={styles.fontButton}
                  onPress={() => handleFontSizeChange(fontSize - 1)}
                  disabled={fontSize <= 12}
                >
                  <Icon
                    name="remove"
                    size={24}
                    color={fontSize <= 12 ? '#a0aec0' : '#1a365d'}
                  />
                </TouchableOpacity>
                
                <Text style={styles.fontSizeDisplay}>{fontSize}px</Text>
                
                <TouchableOpacity
                  style={styles.fontButton}
                  onPress={() => handleFontSizeChange(fontSize + 1)}
                  disabled={fontSize >= 24}
                >
                  <Icon
                    name="add"
                    size={24}
                    color={fontSize >= 24 ? '#a0aec0' : '#1a365d'}
                  />
                </TouchableOpacity>
              </View>
              <Slider
                style={styles.fontSlider}
                minimumValue={12}
                maximumValue={24}
                value={fontSize}
                onValueChange={handleFontSizeChange}
                minimumTrackTintColor="#1a365d"
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor="#1a365d"
              />
            </View>
            
            {/* Line Height */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Line Height</Text>
              <View style={styles.lineHeightControls}>
                {[1.2, 1.5, 1.8, 2.0].map((height) => (
                  <TouchableOpacity
                    key={height}
                    style={[
                      styles.lineHeightButton,
                      lineHeight === height && styles.lineHeightButtonActive,
                    ]}
                    onPress={() => handleLineHeightChange(height)}
                  >
                    <Text style={styles.lineHeightText}>{height}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Additional Settings */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>More Options</Text>
              {[
                { label: 'Sync Reading Progress', value: true },
                { label: 'Auto Night Mode', value: false },
                { label: 'Page Turn Animation', value: true },
                { label: 'Tap to Turn Page', value: true },
              ].map((option, index) => (
                <View key={index} style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>{option.label}</Text>
                  <Switch
                    value={option.value}
                    onValueChange={() => {}}
                    trackColor={{ false: '#e2e8f0', true: '#1a365d' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.settingsFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setFontSize(16);
                setTheme('light');
                setLineHeight(1.5);
                loadBook();
              }}
            >
              <Text style={styles.resetText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const getThemeColor = (theme) => {
    switch (theme) {
      case 'light': return '#ffffff';
      case 'sepia': return '#f8f0e3';
      case 'dark': return '#1a202c';
      default: return '#ffffff';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={getThemeColor(theme)}
      />
      
      {/* Book Content */}
      <TouchableOpacity
        style={styles.contentArea}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a365d" />
            <Text style={styles.loadingText}>Loading book...</Text>
          </View>
        ) : (
          <WebView
            source={{ html: bookContent }}
            style={styles.webView}
            onLoadEnd={() => setIsLoading(false)}
            scalesPageToFit={Platform.OS === 'android'}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        )}
      </TouchableOpacity>

      {/* Controls Overlay */}
      {renderControls()}

      {/* Settings Modal */}
      {renderSettings()}

      {/* Offline Indicator */}
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Icon name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Reading Offline</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#718096',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  bookTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pageInfo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  navButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  pageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  pageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageSeparator: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  offlineIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  settingsContent: {
    paddingHorizontal: 24,
  },
  settingSection: {
    marginTop: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  themeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeButton: {
    alignItems: 'center',
  },
  themeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a365d',
  },
  themePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  themeText: {
    fontSize: 12,
    color: '#4a5568',
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fontButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  fontSlider: {
    width: '100%',
    height: 40,
  },
  lineHeightControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineHeightButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  lineHeightButtonActive: {
    backgroundColor: '#1a365d',
  },
  lineHeightText: {
    fontSize: 16,
    color: '#4a5568',
  },
  lineHeightButtonActive: {
    backgroundColor: '#1a365d',
  },
  lineHeightTextActive: {
    color: '#fff',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  settingsFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  resetButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  resetText: {
    color: '#4a5568',
    fontWeight: '600',
  },
});