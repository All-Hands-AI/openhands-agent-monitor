interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class Cache {
  private static instance: Cache;
  private storage: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;

  private constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.storage = new Map();
    this.defaultTTL = defaultTTL;
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, value: T, ttl = this.defaultTTL): void {
    const now = Date.now();
    this.storage.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.storage.clear();
  }

  delete(key: string): void {
    this.storage.delete(key);
  }
}