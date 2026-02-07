# Raphaels Horizon Book

A professional mobile reading application for Raphael's Horizon books library. This app provides seamless access to both online and offline books, audio books, and a personalized reading experience.

## Features

### 📚 Book Reading
- Professional online book reader
- Calibre-Web integration
- Multiple formats support (EPUB, PDF, MOBI)
- Adjustable reading settings (font size, theme, spacing)
- Night mode for comfortable reading

### 🔊 Audio Books
- High-quality audio streaming
- Background playback support
- Sleep timer
- Playback speed control
- Offline listening

### 📱 Offline Capabilities
- Download books for offline reading
- Sync reading progress when online
- Manage storage space
- Auto-cleanup of old downloads

### 👤 User Features
- User authentication (Email/Google)
- Personalized reading library
- Reading statistics and goals
- Bookmarks and annotations
- Reading history

### 🎨 Professional Design
- Consistent branding with Raphael's Horizon
- Dark/Light mode support
- Smooth animations and transitions
- Intuitive user interface

## Tech Stack

- **React Native** - Cross-platform mobile development
- **React Navigation** - Routing and navigation
- **Redux Toolkit** - State management
- **React Native WebView** - Book rendering
- **React Native Track Player** - Audio playback
- **React Native FS** - File system operations
- **React Native Vector Icons** - Icon library
- **React Native Reanimated** - Smooth animations
- **Async Storage** - Local data persistence

## Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- iOS: Xcode 13+
- Android: Android Studio, Java 11+

### Setup
```bash
# Clone the repository
git clone https://github.com/raphaelshorizon/raphaels-horizon-book.git

# Install dependencies
cd raphaels-horizon-book
npm install

# iOS
cd ios && pod install && cd ..

# Android
# Open Android Studio and sync Gradle