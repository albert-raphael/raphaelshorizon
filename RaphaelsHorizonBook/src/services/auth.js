import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Config from 'react-native-config';

const API_BASE_URL = Config.API_URL || 'https://api.raphaelshorizon.com';

export const AuthService = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async googleLogin(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async saveAuthData(data) {
    await AsyncStorage.setItem('@userToken', data.token);
    await AsyncStorage.setItem('@userData', JSON.stringify(data.user));
    await AsyncStorage.setItem('@refreshToken', data.refreshToken);
  },

  async logout() {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      await this.clearAuthData();
      return { success: true };
    } catch (error) {
      await this.clearAuthData();
      return { success: true };
    }
  },

  async clearAuthData() {
    await AsyncStorage.multiRemove([
      '@userToken',
      '@userData',
      '@refreshToken',
    ]);
  },

  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('@userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('@refreshToken');
      
      if (!refreshToken) {
        return { success: false };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        await this.saveAuthData(data);
        return { success: true, token: data.token };
      } else {
        return { success: false };
      }
    } catch (error) {
      return { success: false };
    }
  },
};

export const BookService = {
  async getBooks(params = {}) {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      const query = new URLSearchParams(params).toString();
      
      const response = await fetch(
        `${API_BASE_URL}/api/books?${query}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getBookDetails(bookId) {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async saveReadingProgress(bookId, progress, chapter) {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(
        `${API_BASE_URL}/api/books/${bookId}/progress`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ progress, chapter }),
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async toggleBookmark(bookId) {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(
        `${API_BASE_URL}/api/books/${bookId}/bookmark`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  },

  async getReadingStats() {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/user/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export const SubscriptionService = {
  async getPlans() {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/subscription/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async getCurrentPlan() {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/subscription/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  },

  async subscribe(planId, paymentMethod) {
    try {
      const token = await AsyncStorage.getItem('@userToken');
      
      const response = await fetch(`${API_BASE_URL}/api/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, paymentMethod }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};