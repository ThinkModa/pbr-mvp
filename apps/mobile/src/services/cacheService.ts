import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  EVENTS: 'events_cache',
  EVENTS_LIST: 'events_list_cache',
  USER_PROFILE: 'user_profile_cache',
  CHAT_THREADS: 'chat_threads_cache',
  CHAT_MESSAGES: 'chat_messages_cache',
  USER_EVENTS: 'user_events_cache',
  PROFILE_CATEGORIES: 'profile_categories_cache',
  PROFILE_INTERESTS: 'profile_interests_cache',
} as const;

// Initialize storage with MMKV for production performance
let storage: any;
try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({
    id: 'pbr-cache',
    encryptionKey: 'pbr-secure-cache-key-2024'
  });
  console.log('✅ MMKV initialized successfully');
} catch (error) {
  console.warn('⚠️ MMKV initialization failed, falling back to AsyncStorage:', error);
  // Fallback to AsyncStorage if MMKV fails
  storage = {
    set: (key: string, value: string) => AsyncStorage.setItem(key, value),
    getString: (key: string) => AsyncStorage.getItem(key),
    delete: (key: string) => AsyncStorage.removeItem(key),
    getAllKeys: () => AsyncStorage.getAllKeys(),
  };
  console.log('✅ AsyncStorage fallback initialized');
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  /**
   * Store data in cache with expiration
   */
  static set<T>(key: string, data: T): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };
      
      storage.set(key, JSON.stringify(cacheItem));
      console.log(`📦 Cached data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error caching data for key ${key}:`, error);
    }
  }

  /**
   * Retrieve data from cache if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const cachedItem = storage.getString(key);
      
      if (!cachedItem) {
        console.log(`📦 No cache found for key: ${key}`);
        return null;
      }

      // Check if the cached item looks like valid JSON
      if (typeof cachedItem !== 'string' || !cachedItem.startsWith('{')) {
        console.warn(`📦 Invalid cache format for key: ${key}, clearing...`);
        storage.delete(key);
        return null;
      }

      const parsedItem: CacheItem<T> = JSON.parse(cachedItem);
      
      // Check if cache is expired
      if (Date.now() > parsedItem.expiresAt) {
        console.log(`📦 Cache expired for key: ${key}, removing...`);
        storage.delete(key);
        return null;
      }

      console.log(`📦 Cache hit for key: ${key} (age: ${Math.round((Date.now() - parsedItem.timestamp) / 1000)}s)`);
      return parsedItem.data;
    } catch (error) {
      console.error(`❌ Error reading cache for key ${key}:`, error);
      // Clear corrupted cache entry
      console.log(`📦 Clearing corrupted cache for key: ${key}`);
      storage.delete(key);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static remove(key: string): void {
    try {
      storage.delete(key);
      console.log(`📦 Removed cache for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error removing cache for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    try {
      const keys = Object.values(CACHE_KEYS);
      keys.forEach(key => storage.delete(key));
      console.log(`📦 Cleared all cache entries`);
    } catch (error) {
      console.error(`❌ Error clearing cache:`, error);
    }
  }

  /**
   * Get cache age in seconds
   */
  static getCacheAge(key: string): number | null {
    try {
      const cachedItem = storage.getString(key);
      
      if (!cachedItem) {
        return null;
      }

      const parsedItem: CacheItem<any> = JSON.parse(cachedItem);
      return Math.round((Date.now() - parsedItem.timestamp) / 1000);
    } catch (error) {
      console.error(`❌ Error getting cache age for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  static isValid(key: string): boolean {
    try {
      const cachedItem = storage.getString(key);
      
      if (!cachedItem) {
        return false;
      }

      const parsedItem: CacheItem<any> = JSON.parse(cachedItem);
      return Date.now() <= parsedItem.expiresAt;
    } catch (error) {
      console.error(`❌ Error checking cache validity for key ${key}:`, error);
      return false;
    }
  }

  // Specific cache methods for different data types
  static setEvents(events: any[]): void {
    this.set(CACHE_KEYS.EVENTS, events);
  }

  static getEvents(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.EVENTS);
  }

  static setEventsList(events: any[]): void {
    this.set(CACHE_KEYS.EVENTS_LIST, events);
  }

  static getEventsList(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.EVENTS_LIST);
  }

  static setUserProfile(profile: any): void {
    this.set(CACHE_KEYS.USER_PROFILE, profile);
  }

  static getUserProfile(): any | null {
    return this.get<any>(CACHE_KEYS.USER_PROFILE);
  }

  static setChatThreads(threads: any[]): void {
    this.set(CACHE_KEYS.CHAT_THREADS, threads);
  }

  static getChatThreads(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.CHAT_THREADS);
  }

  // Chat Messages caching (per thread)
  static setChatMessages(threadId: string, messages: any[]): void {
    this.set(`${CACHE_KEYS.CHAT_MESSAGES}_${threadId}`, messages);
  }

  static getChatMessages(threadId: string): any[] | null {
    return this.get<any[]>(`${CACHE_KEYS.CHAT_MESSAGES}_${threadId}`);
  }

  // User Events caching
  static setUserEvents(userId: string, events: any[]): void {
    this.set(`${CACHE_KEYS.USER_EVENTS}_${userId}`, events);
  }

  static getUserEvents(userId: string): any[] | null {
    return this.get<any[]>(`${CACHE_KEYS.USER_EVENTS}_${userId}`);
  }

  // Profile Categories caching
  static setProfileCategories(categories: any[]): void {
    this.set(CACHE_KEYS.PROFILE_CATEGORIES, categories);
  }

  static getProfileCategories(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.PROFILE_CATEGORIES);
  }

  // Profile Interests caching
  static setProfileInterests(interests: any[]): void {
    this.set(CACHE_KEYS.PROFILE_INTERESTS, interests);
  }

  static getProfileInterests(): any[] | null {
    return this.get<any[]>(CACHE_KEYS.PROFILE_INTERESTS);
  }

  // Invalidate specific caches when data changes
  static invalidateEvents(): void {
    this.remove(CACHE_KEYS.EVENTS);
    this.remove(CACHE_KEYS.EVENTS_LIST);
  }

  static invalidateUserProfile(): void {
    this.remove(CACHE_KEYS.USER_PROFILE);
  }

  static invalidateChatThreads(): void {
    this.remove(CACHE_KEYS.CHAT_THREADS);
  }

  static async invalidateChatMessages(threadId?: string): Promise<void> {
    if (threadId) {
      this.remove(`${CACHE_KEYS.CHAT_MESSAGES}_${threadId}`);
    } else {
      // Remove all chat message caches
      const keys = await storage.getAllKeys();
      const chatMessageKeys = keys.filter((key: string) => key.startsWith(CACHE_KEYS.CHAT_MESSAGES));
      chatMessageKeys.forEach((key: string) => storage.delete(key));
    }
  }

  static async invalidateUserEvents(userId?: string): Promise<void> {
    if (userId) {
      this.remove(`${CACHE_KEYS.USER_EVENTS}_${userId}`);
    } else {
      // Remove all user event caches
      const keys = await storage.getAllKeys();
      const userEventKeys = keys.filter((key: string) => key.startsWith(CACHE_KEYS.USER_EVENTS));
      userEventKeys.forEach((key: string) => storage.delete(key));
    }
  }

  static invalidateProfileData(): void {
    this.remove(CACHE_KEYS.PROFILE_CATEGORIES);
    this.remove(CACHE_KEYS.PROFILE_INTERESTS);
  }

  // Invalidate all user-related caches when user profile changes
  static async invalidateUserData(userId?: string): Promise<void> {
    this.invalidateUserProfile();
    this.invalidateChatThreads();
    await this.invalidateChatMessages();
    if (userId) {
      await this.invalidateUserEvents(userId);
    }
  }

  // Clear all cache data (useful for development/debugging)
  static async clearAllCache(): Promise<void> {
    try {
      console.log('📦 Clearing all cache data...');
      const keys = await storage.getAllKeys();
      console.log('📦 Found cache keys:', keys);
      
      keys.forEach((key: string) => {
        storage.delete(key);
      });
      console.log('✅ All cache data cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Clear only corrupted cache entries
  static async clearCorruptedCache(): Promise<void> {
    try {
      console.log('📦 Checking for corrupted cache entries...');
      const keys = await storage.getAllKeys();
      let corruptedCount = 0;
      
      for (const key of keys) {
        try {
          const cachedItem = storage.getString(key);
          if (cachedItem && (typeof cachedItem !== 'string' || !cachedItem.startsWith('{'))) {
            console.log(`📦 Found corrupted cache entry: ${key}, clearing...`);
            storage.delete(key);
            corruptedCount++;
          }
        } catch (error) {
          console.log(`📦 Found corrupted cache entry: ${key}, clearing...`);
          storage.delete(key);
          corruptedCount++;
        }
      }
      
      if (corruptedCount > 0) {
        console.log(`✅ Cleared ${corruptedCount} corrupted cache entries`);
      } else {
        console.log('✅ No corrupted cache entries found');
      }
    } catch (error) {
      console.error('❌ Error checking for corrupted cache:', error);
    }
  }
}

export default CacheService;
