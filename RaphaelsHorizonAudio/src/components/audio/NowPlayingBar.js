import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAudio } from '../context/AudioContext';
import { LinearGradient } from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const NowPlayingBar = () => {
  const navigation = useNavigation();
  const {
    nowPlaying,
    isPlaying,
    playbackPosition,
    playbackDuration,
    togglePlayPause,
  } = useAudio();

  if (!nowPlaying) return null;

  const progressPercentage = playbackDuration > 0
    ? (playbackPosition / playbackDuration) * 100
    : 0;

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Player')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(44, 62, 80, 0.95)', 'rgba(52, 152, 219, 0.95)']}
        style={styles.gradient}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>

        <View style={styles.content}>
          {/* Album Cover */}
          <Image
            source={{ uri: nowPlaying.coverUrl }}
            style={styles.cover}
          />

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {nowPlaying.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {nowPlaying.author}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    marginLeft: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NowPlayingBar;