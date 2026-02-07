import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export default function BookDetailsScreen({ route, navigation }) {
  const { book } = route.params;
  const [isBookmarked, setIsBookmarked] = useState(book.bookmarked || false);
  const [readProgress, setReadProgress] = useState(book.progress || 0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const chapters = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Chapter ${i + 1}`,
    description: `Chapter ${i + 1} description`,
    duration: `${Math.floor(Math.random() * 60)} min`,
  }));

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Save bookmark to API
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${book.title}" by ${book.author} on Raphaels Horizon Book: ${book.description}`,
        url: 'https://raphaelshorizon.com',
        title: book.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share book');
    }
  };

  const handleRead = () => {
    navigation.navigate('BookReader', { book });
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Book download will start shortly');
  };

  const handleChapterSelect = (chapter) => {
    setCurrentChapter(chapter);
    // Navigate to specific chapter in reader
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <Image source={book.cover} style={styles.headerImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.headerGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={handleBookmark}>
              <Icon
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleShare}>
              <Icon name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleDownload}>
              <Icon name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Info */}
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>by {book.author}</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    size={16}
                    color={star <= Math.floor(book.rating) ? '#FFD700' : '#e2e8f0'}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{book.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({Math.floor(Math.random() * 1000)} reviews)</Text>
            </View>
          </View>

          {/* Progress Bar */}
          {readProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Reading Progress</Text>
                <Text style={styles.progressPercentage}>{readProgress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${readProgress}%` }]}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRead}>
              <LinearGradient
                colors={['#1a365d', '#2d4a7d']}
                style={styles.buttonGradient}
              >
                <Icon name="book" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>
                  {readProgress > 0 ? 'Continue Reading' : 'Start Reading'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
              <Icon name="download" size={20} color="#1a365d" />
              <Text style={styles.secondaryButtonText}>Download</Text>
            </TouchableOpacity>
          </View>

          {/* Book Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Book Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icon name="document-text" size={20} color="#718096" />
                <Text style={styles.detailLabel}>Pages</Text>
                <Text style={styles.detailValue}>{book.pages}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="language" size={20} color="#718096" />
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{book.language}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="bookmark" size={20} color="#718096" />
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{book.category}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="cube" size={20} color="#718096" />
                <Text style={styles.detailLabel}>Format</Text>
                <Text style={styles.detailValue}>{book.format}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {book.description}
            </Text>
            {!showFullDescription && (
              <TouchableOpacity onPress={() => setShowFullDescription(true)}>
                <Text style={styles.readMore}>Read more</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Chapters */}
          <View style={styles.chaptersSection}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={[
                  styles.chapterItem,
                  currentChapter === chapter.id && styles.chapterItemActive,
                ]}
                onPress={() => handleChapterSelect(chapter.id)}
              >
                <View style={styles.chapterInfo}>
                  <Text
                    style={[
                      styles.chapterNumber,
                      currentChapter === chapter.id && styles.chapterNumberActive,
                    ]}
                  >
                    {chapter.id}
                  </Text>
                  <View>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterDescription}>
                      {chapter.description}
                    </Text>
                  </View>
                </View>
                <Text style={styles.chapterDuration}>{chapter.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reviews */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllReviews}>See All</Text>
              </TouchableOpacity>
            </View>
            {/* Add review components here */}
          </View>

          {/* Related Books */}
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>You May Also Like</Text>
            {/* Add related books carousel */}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={handleBookmark}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? '#e63946' : '#718096'}
          />
          <Text
            style={[
              styles.bottomButtonText,
              isBookmarked && styles.bottomButtonTextActive,
            ]}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButton} onPress={handleShare}>
          <Icon name="share-outline" size={24} color="#718096" />
          <Text style={styles.bottomButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.readNowButton}
          onPress={handleRead}
        >
          <LinearGradient
            colors={['#1a365d', '#2d4a7d']}
            style={StyleSheet.absoluteFill}
          />
          <Icon name="book" size={20} color="#fff" />
          <Text style={styles.readNowText}>
            {readProgress > 0 ? 'Continue' : 'Read Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  contentContainer: {
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  bookTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    lineHeight: 34,
  },
  bookAuthor: {
    fontSize: 18,
    color: '#718096',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#a0aec0',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#718096',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a365d',
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  primaryButton: {
    flex: 2,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#1a365d',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  descriptionSection: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  readMore: {
    color: '#1a365d',
    fontWeight: '600',
    marginTop: 8,
  },
  chaptersSection: {
    marginBottom: 32,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  chapterItemActive: {
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#1a365d',
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  chapterNumberActive: {
    backgroundColor: '#1a365d',
    color: '#fff',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 14,
    color: '#718096',
  },
  chapterDuration: {
    fontSize: 14,
    color: '#718096',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllReviews: {
    color: '#1a365d',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bottomButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomButtonText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  bottomButtonTextActive: {
    color: '#e63946',
    fontWeight: '600',
  },
  readNowButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 12,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  readNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});