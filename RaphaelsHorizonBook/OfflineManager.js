import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import { unzip } from 'react-native-zip-archive';

export class OfflineManager {
  static STORAGE_KEY = '@offline_books';
  static DOWNLOAD_PATH = RNFS.DocumentDirectoryPath + '/books/';
  static CACHE_PATH = RNFS.CacheDirectoryPath + '/book_cache/';

  static async initialize() {
    try {
      // Create directories if they don't exist
      const dirsExist = await RNFS.exists(this.DOWNLOAD_PATH);
      if (!dirsExist) {
        await RNFS.mkdir(this.DOWNLOAD_PATH);
      }
      
      const cacheExists = await RNFS.exists(this.CACHE_PATH);
      if (!cacheExists) {
        await RNFS.mkdir(this.CACHE_PATH);
      }
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
    }
  }

  static async downloadBook(book) {
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        throw new Error('No internet connection');
      }

      const bookPath = `${this.DOWNLOAD_PATH}${book.id}/`;
      const epubPath = `${bookPath}${book.id}.epub`;
      const infoPath = `${bookPath}info.json`;
      const coverPath = `${bookPath}cover.jpg`;

      // Create book directory
      await RNFS.mkdir(bookPath);

      // Download book file (EPUB/PDF)
      const downloadResult = await RNFS.downloadFile({
        fromUrl: book.downloadUrl,
        toFile: epubPath,
        background: true,
        discretionary: true,
        progress: (res) => {
          // Progress callback
          const progress = (res.bytesWritten / res.contentLength) * 100;
          this.emitDownloadProgress(book.id, progress);
        },
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error('Download failed');
      }

      // Download cover image
      if (book.coverUrl) {
        await RNFS.downloadFile({
          fromUrl: book.coverUrl,
          toFile: coverPath,
        }).promise;
      }

      // Save book metadata
      const bookInfo = {
        ...book,
        downloadedAt: new Date().toISOString(),
        filePath: epubPath,
        coverPath: book.coverUrl ? coverPath : null,
        fileSize: downloadResult.bytesWritten,
        format: book.format || 'epub',
      };

      await RNFS.writeFile(infoPath, JSON.stringify(bookInfo), 'utf8');

      // Update offline books list
      await this.addToOfflineList(bookInfo);

      return {
        success: true,
        book: bookInfo,
        path: epubPath,
      };
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async addToOfflineList(book) {
    try {
      const offlineBooks = await this.getOfflineBooks();
      const existingIndex = offlineBooks.findIndex(b => b.id === book.id);
      
      if (existingIndex >= 0) {
        offlineBooks[existingIndex] = book;
      } else {
        offlineBooks.push(book);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineBooks));
      return true;
    } catch (error) {
      console.error('Error adding to offline list:', error);
      return false;
    }
  }

  static async getOfflineBooks() {
    try {
      const booksJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return booksJson ? JSON.parse(booksJson) : [];
    } catch (error) {
      console.error('Error getting offline books:', error);
      return [];
    }
  }

  static async getOfflineBook(bookId) {
    try {
      const offlineBooks = await this.getOfflineBooks();
      return offlineBooks.find(book => book.id === bookId) || null;
    } catch (error) {
      console.error('Error getting offline book:', error);
      return null;
    }
  }

  static async isBookDownloaded(bookId) {
    try {
      const book = await this.getOfflineBook(bookId);
      if (!book || !book.filePath) return false;
      
      const fileExists = await RNFS.exists(book.filePath);
      return fileExists;
    } catch (error) {
      return false;
    }
  }

  static async deleteOfflineBook(bookId) {
    try {
      const book = await this.getOfflineBook(bookId);
      if (!book) return false;

      // Delete book files
      if (book.filePath) {
        await RNFS.unlink(book.filePath).catch(() => {});
      }
      if (book.coverPath) {
        await RNFS.unlink(book.coverPath).catch(() => {});
      }

      // Delete book directory
      const bookDir = this.DOWNLOAD_PATH + bookId;
      await RNFS.unlink(bookDir).catch(() => {});

      // Update offline books list
      const offlineBooks = await this.getOfflineBooks();
      const updatedBooks = offlineBooks.filter(b => b.id !== bookId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedBooks));

      return true;
    } catch (error) {
      console.error('Error deleting offline book:', error);
      return false;
    }
  }

  static async getOfflineStorageInfo() {
    try {
      const offlineBooks = await this.getOfflineBooks();
      let totalSize = 0;

      for (const book of offlineBooks) {
        if (book.fileSize) {
          totalSize += book.fileSize;
        } else if (book.filePath) {
          try {
            const stats = await RNFS.stat(book.filePath);
            totalSize += stats.size;
          } catch (e) {
            // Skip if file doesn't exist
          }
        }
      }

      return {
        count: offlineBooks.length,
        totalSize: totalSize,
        formattedSize: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { count: 0, totalSize: 0, formattedSize: '0 MB' };
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async isConnected() {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  }

  static async syncReadingProgress() {
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) return false;

      const offlineProgress = await this.getOfflineProgress();
      
      // Sync each progress update with server
      for (const progress of offlineProgress) {
        await this.uploadProgress(progress);
        await this.removeOfflineProgress(progress.id);
      }

      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  static async saveReadingProgressLocally(bookId, progress, chapter, page) {
    try {
      const progressData = {
        id: `${bookId}_${Date.now()}`,
        bookId,
        progress,
        chapter,
        page,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      const existingProgress = await AsyncStorage.getItem('@reading_progress');
      const allProgress = existingProgress ? JSON.parse(existingProgress) : [];
      
      // Remove old progress for same book
      const filteredProgress = allProgress.filter(p => p.bookId !== bookId);
      filteredProgress.push(progressData);
      
      await AsyncStorage.setItem('@reading_progress', JSON.stringify(filteredProgress));
      return true;
    } catch (error) {
      console.error('Error saving progress locally:', error);
      return false;
    }
  }

  static async getOfflineProgress() {
    try {
      const progressJson = await AsyncStorage.getItem('@reading_progress');
      return progressJson ? JSON.parse(progressJson) : [];
    } catch (error) {
      return [];
    }
  }

  static async removeOfflineProgress(progressId) {
    try {
      const allProgress = await this.getOfflineProgress();
      const filteredProgress = allProgress.filter(p => p.id !== progressId);
      await AsyncStorage.setItem('@reading_progress', JSON.stringify(filteredProgress));
      return true;
    } catch (error) {
      return false;
    }
  }

  static async uploadProgress(progress) {
    // Implement API call to sync progress
    // This should match your server's API
    try {
      const token = await AsyncStorage.getItem('@userToken');
      const response = await fetch('https://api.raphaelshorizon.com/api/progress/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
      });

      return response.ok;
    } catch (error) {
      throw error;
    }
  }

  static emitDownloadProgress(bookId, progress) {
    // Emit event for UI updates
    // You can use EventEmitter or Context for this
    const event = {
      type: 'DOWNLOAD_PROGRESS',
      bookId,
      progress,
    };
    
    // Dispatch to your state management system
    // This is a placeholder - implement based on your state management
    if (global.eventEmitter) {
      global.eventEmitter.emit('download_progress', event);
    }
  }

  static async clearCache() {
    try {
      await RNFS.unlink(this.CACHE_PATH);
      await RNFS.mkdir(this.CACHE_PATH);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  static async cleanupOldBooks(days = 30) {
    try {
      const offlineBooks = await this.getOfflineBooks();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (const book of offlineBooks) {
        if (book.downloadedAt && new Date(book.downloadedAt) < cutoffDate) {
          await this.deleteOfflineBook(book.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error cleaning up old books:', error);
      return false;
    }
  }
}