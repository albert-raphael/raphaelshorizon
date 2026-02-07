import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Slider,
  Animated,
  PanResponder,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
} from 'react-native-track-player';

const { width, height } = Dimensions.get('window');

export default function AudioPlayer({ book, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const playbackState = usePlaybackState();
  const progress = useProgress();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    initializePlayer();
    
    return () => {
      TrackPlayer.reset();
    };
  }, []);

  useEffect(() => {
    if (playbackState === State.Playing) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [playbackState]);

  const initializePlayer = async () => {
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.add({
        id: book.id,
        url: book.audioUrl,
        title: book.title,
        artist: book.author,
        artwork: book.cover,
      });
      
      const track = await TrackPlayer.getTrack(book.id);
      setDuration(track.duration || 0);
      
      await TrackPlayer.play();
    } catch (error) {
      console.error('Player initialization error:', error);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const handleSeek = async (value) => {
    await TrackPlayer.seekTo(value);
  };

  const handleSkipForward = async () => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + 15);
  };

  const handleSkipBackward = async () => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - 15));
  };

  const handlePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const nextRate = rates[nextIndex];
    
    setPlaybackRate(nextRate);
    TrackPlayer.setRate(nextRate);
  };

  const handleSleepTimer = () => {
    const timers = [null, 15, 30, 45, 60];
    const currentIndex = timers.indexOf(sleepTimer);
    const nextIndex = (currentIndex + 1) % timers.length;
    const nextTimer = timers[nextIndex];
    
    setSleepTimer(nextTimer);
    
    if (nextTimer) {
      // Set timer to stop playback after specified minutes
      setTimeout(() => {
        TrackPlayer.pause();
      }, nextTimer * 60 * 1000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0d1b2a', '#1a365d']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Now Playing
          </Text>
          <Text style={headerSubtitle} numberOfLines={1}>
            {book.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artContainer}>
        <Image source={book.cover} style={styles.albumArt} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.artShadow}
        />
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.trackArtist}>{book.author}</Text>
        <Text style={styles.trackNarrator}>Narrated by: {book.narrator}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={progress.position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#2d6a4f"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#2d6a4f"
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handlePlaybackRate}
        >
          <Text style={styles.rateText}>{playbackRate}x</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleSkipBackward}>
          <Icon name="play-back" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <LinearGradient
            colors={['#2d6a4f', '#3a8a66']}
            style={styles.playButtonGradient}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleSkipForward}>
          <Icon name="play-forward" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSleepTimer}
        >
          <Icon
            name={sleepTimer ? 'bed' : 'bed-outline'}
            size={24}
            color={sleepTimer ? '#2d6a4f' : '#fff'}
          />
          {sleepTimer && (
            <Text style={styles.timerText}>{sleepTimer}m</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#e63946' : '#fff'}
          />
          <Text style={styles.secondaryButtonText}>Favorite</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Icon name="repeat" size={24} color="#fff" />
          <Text style={styles.secondaryButtonText}>Repeat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Icon name="list" size={24} color="#fff" />
          <Text style={styles.secondaryButtonText}>Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Icon name="share-outline" size={24} color="#fff" />
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Chapter List */}
      <TouchableOpacity style={styles.chaptersButton}>
        <Text style={styles.chaptersText}>View Chapters</Text>
        <Icon name="chevron-forward" size={20} color="#a0aec0" />
      </TouchableOpacity>

      {/* Sleep Timer Indicator */}
      {sleepTimer && (
        <View style={styles.sleepTimerIndicator}>
          <Text style={styles.sleepTimerText}>
            Sleep timer: {sleepTimer} minutes
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  closeButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#a0aec0',
    fontSize: 14,
  },
  menuButton: {
    padding: 8,
  },
  artContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArt: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  artShadow: {
    position: 'absolute',
    bottom: -20,
    width: width * 0.7,
    height: 40,
    borderRadius: 20,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  trackArtist: {
    color: '#a0aec0',
    fontSize: 18,
    marginBottom: 4,
  },
  trackNarrator: {
    color: '#718096',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  timeText: {
    color: '#a0aec0',
    fontSize: 14,
    width: 50,
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: '#2d6a4f',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#a0aec0',
    fontSize: 12,
    marginTop: 6,
  },
  chaptersButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  },
  chaptersText: {
    color: '#a0aec0',
    fontSize: 16,
    marginRight: 8,
  },
  sleepTimerIndicator: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(45, 106, 79, 0.9)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  sleepTimerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});