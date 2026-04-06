"""
Initialize Redis proxy pool for court scraping.
Proxies are needed to avoid IP blocking from court websites.
"""
import redis
import os


def init_proxy_pool():
    r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

    # Example proxy pool (replace with real proxies)
    # These would be paid proxy service IPs
    proxies = [
        # "http://user:pass@proxy1.example.com:8080",
        # "http://user:pass@proxy2.example.com:8080",
    ]

    for proxy in proxies:
        r.rpush("scraper:proxy:pool", proxy)

    print(f"Added {len(proxies)} proxies to pool")


if __name__ == "__main__":
    init_proxy_pool()
