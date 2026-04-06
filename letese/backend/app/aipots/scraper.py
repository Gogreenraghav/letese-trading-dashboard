"""
LETESE● AIPOT-SCRAPER — Court Web Scraper Agent
Consumes: letese.scraper.jobs
Produces: letese.diary.updates, letese.orders.new
Supports: PHAHC, DHC, SC, NCDRC, CHD_DC, CONSUMER_PH, TIS_HAZ, SAKET
"""
import hashlib
import random
from app.aipots.base import BaseAIPOT

COURT_CONFIGS = {
    "PHAHC": {
        "name": "Punjab & Haryana High Court",
        "search_url": "https://hcpunjab.gov.in/",
        "requires_js": True,
        "selectors": {
            "next_date": "span[id*='nextDate']",
            "last_order": "span[id*='orderDetails']",
            "bench": "span[id*='coramDetails']",
        },
    },
    "DHC": {
        "name": "Delhi High Court",
        "search_url": "https://delhihighcourt.nic.in/case_status_new.asp",
        "requires_js": False,
        "selectors": {
            "next_date": "td.tdStyle:nth-child(4)",
            "last_order": "td.tdStyle:nth-child(6)",
        },
    },
    "SC": {
        "name": "Supreme Court of India",
        "search_url": "https://main.sci.gov.in/case-status",
        "requires_js": True,
        "selectors": {
            "next_date": ".case-next-date",
            "last_order": ".case-order-text",
        },
    },
    "NCDRC": {"name": "NCDRC", "requires_js": False},
    "CHD_DC": {"name": "Chandigarh District Courts", "requires_js": True},
    "CONSUMER_PH": {"name": "Punjab Consumer Forums", "requires_js": False},
    "TIS_HAZ": {"name": "Tis Hazari District Court", "requires_js": True},
    "SAKET": {"name": "Saket District Court", "requires_js": True},
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
]


class AIPOTScraper(BaseAIPOT):
    """
    Court case scraper — scrapes P&H HC, Delhi HC, SC, NCDRC and more.
    Uses Playwright for JS-heavy sites, httpx for simpler HTML sites.
    Rate-limits: 14 min minimum between scrapes per case.
    Content dedup: SHA-256 of order text + hearing date.
    """
    input_topic = "letese.scraper.jobs"

    async def process_message(self, payload: dict):
        case_id = payload["case_id"]
        court_code = payload["court_code"]
        case_number = payload["case_number"]
        tenant_id = payload["tenant_id"]

        config = COURT_CONFIGS.get(court_code)
        if not config:
            raise ValueError(f"Unknown court_code: {court_code}")

        # Rate-limit: skip if scraped < 14 min ago
        if self.redis:
            last_scrape = await self.redis.get(f"scraper:last:{case_id}")
            if last_scrape:
                return

        # Scrape the court
        extracted = await self._scrape_court(config, case_number)
        if not extracted:
            return

        # Content dedup
        content_str = (extracted.get("last_order_text", "") +
                       str(extracted.get("next_hearing", "")))
        content_hash = hashlib.sha256(content_str.encode()).hexdigest()

        existing_hash = None
        if self.redis:
            existing_hash = await self.redis.get(f"scraper:hash:{case_id}")

        is_new = (existing_hash != content_hash)

        if is_new:
            # Publish diary update
            await self.producer.send("letese.diary.updates", {
                "case_id": case_id,
                "tenant_id": tenant_id,
                "court_code": court_code,
                **extracted,
            })

            # If new order detected, publish order alert
            if extracted.get("is_new_order"):
                await self.producer.send("letese.orders.new", {
                    "case_id": case_id,
                    "tenant_id": tenant_id,
                    "court_code": court_code,
                    "order_text": extracted.get("last_order_text", ""),
                    "order_date": extracted.get("last_order_date", ""),
                    "client_phone": payload.get("client_phone"),
                    "client_name": payload.get("client_name"),
                    "case_title": payload.get("case_title"),
                    "advocate_name": payload.get("advocate_name"),
                    "next_hearing": extracted.get("next_hearing"),
                })

            if self.redis:
                await self.redis.set(f"scraper:hash:{case_id}", content_hash, ex=86400)

        # Update rate-limit: 14 min TTL
        if self.redis:
            await self.redis.set(f"scraper:last:{case_id}", "1", ex=840)

    async def _scrape_court(self, config: dict, case_number: str) -> dict | None:
        """Route to Playwright or httpx based on JS requirement."""
        proxy = None
        if self.redis:
            proxy = await self.redis.lmove(
                "scraper:proxy:pool", "scraper:proxy:pool", "LEFT", "RIGHT")

        ua = random.choice(USER_AGENTS)

        if config.get("requires_js"):
            return await self._playwright_scrape(config, case_number, proxy, ua)
        else:
            return await self._httpx_scrape(config, case_number, proxy, ua)

    async def _playwright_scrape(
        self, config: dict, case_number: str, proxy: str | None, ua: str
    ) -> dict:
        """Scrape JS-heavy court portals using Playwright."""
        async with async_playwright() as p:
            kwargs = {"headless": True}
            if proxy:
                kwargs["proxy"] = {"server": proxy}

            browser = await p.chromium.launch(**kwargs)
            ctx = await browser.new_context(
                user_agent=ua,
                viewport={"width": 1280, "height": 720},
            )
            page = await ctx.new_page()

            try:
                await page.goto(config["search_url"], timeout=30000)
                await page.wait_for_load_state("networkidle", timeout=15000)

                # Court-specific form filling (simplified)
                await self._fill_case_search(page, case_number, config)
                result = {}

                for key, sel in config.get("selectors", {}).items():
                    try:
                        el = page.locator(sel).first
                        result[key] = (await el.inner_text()).strip()
                    except Exception:
                        result[key] = None

                # Detect new order (simplified heuristic)
                result["is_new_order"] = bool(result.get("last_order"))

                return result
            finally:
                await browser.close()

    async def _httpx_scrape(
        self, config: dict, case_number: str, proxy: str | None, ua: str
    ) -> dict:
        """Scrape simple HTML court portals with httpx."""
        import httpx
        from bs4 import BeautifulSoup

        proxies = {"http://": proxy, "https://": proxy} if proxy else None
        async with httpx.AsyncClient(
            proxies=proxies,
            headers={"User-Agent": ua},
            timeout=20,
        ) as client:
            resp = await client.get(
                config["search_url"],
                params={"case_no": case_number},
            )
            soup = BeautifulSoup(resp.text, "html.parser")
            result = {}
            for key, sel in config.get("selectors", {}).items():
                el = soup.select_one(sel)
                result[key] = el.get_text(strip=True) if el else None
            result["is_new_order"] = bool(result.get("last_order"))
            return result

    async def _fill_case_search(self, page, case_number: str, config: dict):
        """Fill court-specific search form. Override per court."""
        # Generic implementation — court-specific selectors would go here
        # For PHAHC, DHC, SC — different form fields
        pass


# Entry point for running as standalone service
async def main():
    import os
    from app.core.config import settings

    agent = AIPOTScraper(
        agent_id="AIPOT-SCRAPER",
        kafka_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        redis_url=settings.REDIS_URL,
    )
    await agent.start()


if __name__ == "__main__":
    asyncio.run(main())
