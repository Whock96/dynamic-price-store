
// Simple cache implementation for Supabase data
interface CacheItem<T> {
  data: T[];
  timestamp: number;
  queryKey: string;
}

// Global cache to share between hook instances
const globalCache: Record<string, CacheItem<any>> = {};

// Helper to generate a cache key based on query options
export const generateCacheKey = (tableName: string, options: any): string => {
  return `${tableName}-${JSON.stringify(options)}`;
};

export const getCachedData = <T>(cacheKey: string, timeout: number): T[] | null => {
  if (globalCache[cacheKey]) {
    const cachedItem = globalCache[cacheKey];
    const now = Date.now();
    
    if (now - cachedItem.timestamp < timeout) {
      console.log(`Using cached data for key ${cacheKey}`);
      return cachedItem.data as T[];
    }
  }
  return null;
};

export const setCacheData = <T>(cacheKey: string, data: T[]): void => {
  globalCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    queryKey: cacheKey
  };
};

export const clearCacheItem = (cacheKey: string): void => {
  delete globalCache[cacheKey];
  console.log(`Cache cleared for key ${cacheKey}`);
};
