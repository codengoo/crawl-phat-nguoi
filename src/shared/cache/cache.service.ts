import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface cho cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache Service - In-memory cache với TTL
 * Cache ở level instance để tránh chi phí Redis
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 60 * 60 * 1000; // 1 giờ (ms)
  
  /**
   * Lấy dữ liệu từ cache
   * @param key Cache key
   * @returns Dữ liệu nếu còn hợp lệ, null nếu không tìm thấy hoặc đã hết hạn
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Kiểm tra expiration
    if (Date.now() > entry.expiresAt) {
      this.logger.debug(`Cache expired for key: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data as T;
  }
  
  /**
   * Lưu dữ liệu vào cache
   * @param key Cache key
   * @param data Dữ liệu cần cache
   * @param ttl Time to live (ms), mặc định 1 giờ
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + actualTTL,
    };
    
    this.cache.set(key, entry);
    this.logger.debug(`Cached data for key: ${key} (TTL: ${actualTTL}ms)`);
  }
  
  /**
   * Xóa một entry khỏi cache
   * @param key Cache key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Deleted cache for key: ${key}`);
    }
    return deleted;
  }
  
  /**
   * Xóa tất cả cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cleared all cache (${size} entries)`);
  }
  
  /**
   * Lấy số lượng entries trong cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Lấy danh sách tất cả keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Dọn dẹp các entries đã hết hạn
   * Nên gọi định kỳ để giải phóng memory
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
    
    return cleanedCount;
  }
  
  /**
   * Lấy thông tin cache stats
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      validEntries: this.cache.size - expiredCount,
    };
  }
}
