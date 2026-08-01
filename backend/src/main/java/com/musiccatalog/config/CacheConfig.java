package com.musiccatalog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

    public static final String ITUNES_SEARCH_CACHE = "itunesSearch";
    public static final long ITUNES_SEARCH_TTL_MS = 10L * 60L * 1000L;

    private final TtlConcurrentMapCache itunesSearchCache = new TtlConcurrentMapCache(ITUNES_SEARCH_CACHE,
            ITUNES_SEARCH_TTL_MS);

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(itunesSearchCache));
        return manager;
    }

    @Scheduled(fixedRate = 60_000L)
    public void evictExpiredItunesCacheEntries() {
        itunesSearchCache.evictExpiredEntries();
    }

    static final class TtlConcurrentMapCache extends ConcurrentMapCache {

        private static final Logger log = LoggerFactory.getLogger(TtlConcurrentMapCache.class);

        private final long ttlMs;
        private final ConcurrentHashMap<Object, Instant> writeTimes = new ConcurrentHashMap<>();

        TtlConcurrentMapCache(String name, long ttlMs) {
            super(name);
            this.ttlMs = ttlMs;
        }

        @Override
        public void put(Object key, Object value) {
            super.put(key, value);
            writeTimes.put(key, Instant.now());
        }

        @Override
        public ValueWrapper putIfAbsent(Object key, Object value) {
            ValueWrapper existing = super.putIfAbsent(key, value);
            if (existing == null) {
                writeTimes.put(key, Instant.now());
            }
            return existing;
        }

        @Override
        public <T> T get(Object key, Callable<T> valueLoader) {
            if (isExpired(key)) {
                evict(key);
            }
            boolean[] loaded = { false };
            T result = super.get(key, () -> {
                loaded[0] = true;
                return valueLoader.call();
            });
            if (loaded[0]) {
                writeTimes.put(key, Instant.now());
            } else {
                log.info("Returned search results from cache. cache={}, key={}", getName(), key);
            }
            return result;
        }

        @Override
        public ValueWrapper get(Object key) {
            if (isExpired(key)) {
                evict(key);
                return null;
            }
            ValueWrapper wrapper = super.get(key);
            if (wrapper != null) {
                log.info("Returned search results from cache. cache={}, key={}", getName(), key);
            }
            return wrapper;
        }

        @Override
        public <T> T get(Object key, Class<T> type) {
            if (isExpired(key)) {
                evict(key);
                return null;
            }
            T value = super.get(key, type);
            if (value != null) {
                log.info("Returned search results from cache. cache={}, key={}", getName(), key);
            }
            return value;
        }

        @Override
        public void evict(Object key) {
            super.evict(key);
            writeTimes.remove(key);
        }

        @Override
        public void clear() {
            super.clear();
            writeTimes.clear();
        }

        private boolean isExpired(Object key) {
            Instant writtenAt = writeTimes.get(key);
            if (writtenAt == null) {
                return false;
            }
            return Instant.now().isAfter(writtenAt.plusMillis(ttlMs));
        }

        void evictExpiredEntries() {
            Instant now = Instant.now();
            int removed = 0;
            for (var entry : writeTimes.entrySet()) {
                if (now.isAfter(entry.getValue().plusMillis(ttlMs))) {
                    evict(entry.getKey());
                    removed++;
                }
            }
            if (removed > 0) {
                log.info("Evicted {} expired entries from cache={}", removed, getName());
            }
        }
    }
}
