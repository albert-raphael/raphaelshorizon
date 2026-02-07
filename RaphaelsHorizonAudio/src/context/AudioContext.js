import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [sound, setSound] = useState(null);
  const [playbackHistory, setPlaybackHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // Load playback history and bookmarks
    loadAudioData();
  }, []);

  const loadAudioData = async () => {
    try {
      const history = await AsyncStorage.getItem('playbackHistory');
      const savedBookmarks = await AsyncStorage.getItem('audioBookmarks');
      
      if (history) setPlaybackHistory(JSON.parse(history));
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    } catch (error) {
      console.error('Error loading audio data:', error);
    }
  };

  const playAudio = async (audioBook) => {
    try {
      // Stop current playback if any
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Create new sound object
      // Note: Replace with actual audio URL from your API
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioBook.audioUrl || 'https://example.com/audio.mp3' },
        { 
          shouldPlay: true,
          volume: volume,
          rate: playbackRate,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setNowPlaying(audioBook);
      setIsPlaying(true);

      // Add to playback history
      const newHistory = [
        { ...audioBook, timestamp: new Date().toISOString() },
        ...playbackHistory.slice(0, 49),
      ];
      setPlaybackHistory(newHistory);
      await AsyncStorage.setItem('playbackHistory', JSON.stringify(newHistory));

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis);
      
      if (status.didJustFinish) {
        handlePlaybackComplete();
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = async (position) => {
    if (sound) {
      await sound.setPositionAsync(position);
      setPlaybackPosition(position);
    }
  };

  const skipForward = async (seconds = 30) => {
    if (sound) {
      const newPosition = Math.min(
        playbackPosition + seconds * 1000,
        playbackDuration
      );
      await seekTo(newPosition);
    }
  };

  const skipBackward = async (seconds = 15) => {
    if (sound) {
      const newPosition = Math.max(playbackPosition - seconds * 1000, 0);
      await seekTo(newPosition);
    }
  };

  const setPlaybackSpeed = async (speed) => {
    setPlaybackRate(speed);
    if (sound) {
      await sound.setRateAsync(speed, true);
    }
  };

  const setVolumeLevel = async (level) => {
    setVolume(level);
    if (sound) {
      await sound.setVolumeAsync(level);
    }
  };

  const addBookmark = async (position, note = '') => {
    if (!nowPlaying) return;

    const bookmark = {
      id: Date.now().toString(),
      bookId: nowPlaying.id,
      title: nowPlaying.title,
      position,
      note,
      timestamp: new Date().toISOString(),
    };

    const newBookmarks = [bookmark, ...bookmarks];
    setBookmarks(newBookmarks);
    await AsyncStorage.setItem('audioBookmarks', JSON.stringify(newBookmarks));
  };

  const handlePlaybackComplete = async () => {
    setIsPlaying(false);
    // Save listening stats
    await saveListeningStats();
  };

  const saveListeningStats = async () => {
    try {
      const stats = JSON.parse(await AsyncStorage.getItem('listeningStats') || '{}');
      const today = new Date().toISOString().split('T')[0];
      
      stats[today] = (stats[today] || 0) + Math.floor(playbackPosition / 60000);
      stats.total = (stats.total || 0) + Math.floor(playbackPosition / 60000);
      
      await AsyncStorage.setItem('listeningStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving listening stats:', error);
    }
  };

  const getListeningStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('listeningStats');
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('Error getting listening stats:', error);
      return {};
    }
  };

  const value = {
    nowPlaying,
    isPlaying,
    playbackPosition,
    playbackDuration,
    playbackRate,
    volume,
    playbackHistory,
    bookmarks,
    playAudio,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    setPlaybackSpeed,
    setVolumeLevel,
    addBookmark,
    getListeningStats,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};