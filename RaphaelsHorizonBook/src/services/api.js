import axios from 'axios';

const API_BASE_URL = 'https://your-api.com/api'; // Replace with your actual API

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Use AsyncStorage in React Native
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (token) => api.post('/auth/google', { token }),
  logout: () => api.post('/auth/logout'),
};

export const booksAPI = {
  getAllBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  searchBooks: (query) => api.get(`/books/search?q=${query}`),
  saveBookmark: (bookId, data) => api.post(`/books/${bookId}/bookmark`, data),
  getReadingProgress: (bookId) => api.get(`/books/${bookId}/progress`),
  saveReadingProgress: (bookId, progress) => api.put(`/books/${bookId}/progress`, progress),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getLibrary: () => api.get('/user/library'),
  getReadingStats: () => api.get('/user/stats'),
};