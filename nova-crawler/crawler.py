"""
Nova Search Crawler — Member 5
Fetches pages and stores metadata for future Nova Search index.

Usage:
  python crawler.py --url https://example.com
  python crawler.py --search "flipkart" --limit 10
"""

import argparse
import hashlib
import json
import re
import time
from urllib.parse import quote_plus, unquote, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Run: pip install -r requirements.txt")
    raise

CRAWL_HEADERS = {
    "User-Agent": "NovaCrawler/1.0 (+https://novabrowser.app/bot)",
    "Accept": "text/html,application/xhtml+xml"
}

OUTPUT_FILE = "crawl_index.jsonl"


def fetch_page(url: str) -> dict | None:
    try:
        r = requests.get(url, headers=CRAWL_HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else url
        text = soup.get_text(separator=" ", strip=True)[:2000]
        links = [a.get("href") for a in soup.find_all("a", href=True)][:50]
        return {
            "url": url,
            "title": title,
            "snippet": text[:300],
            "links": links,
            "crawled_at": int(time.time()),
            "hash": hashlib.sha256(r.text.encode()).hexdigest()[:16]
        }
    except Exception as e:
        print(f"  [skip] {url}: {e}")
        return None


def search_ddg(query: str, limit: int = 10) -> list[str]:
    """Get URLs from DuckDuckGo HTML (bootstrap until own index exists)."""
    urls = []
    try:
        r = requests.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query},
            headers={**CRAWL_HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
            timeout=15
        )
        for match in re.finditer(r'uddg=([^&"]+)', r.text):
            url = unquote(match.group(1))
            if url.startswith("http") and url not in urls:
                urls.append(url)
            if len(urls) >= limit:
                break
    except Exception as e:
        print(f"Search failed: {e}")
    return urls


def save_result(result: dict):
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(result, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Nova Search Crawler")
    parser.add_argument("--url", help="Single URL to crawl")
    parser.add_argument("--search", help="Search query, crawl top results")
    parser.add_argument("--limit", type=int, default=10, help="Max URLs from search")
    args = parser.parse_args()

    urls = []
    if args.url:
        urls = [args.url]
    elif args.search:
        print(f"Searching: {args.search}")
        urls = search_ddg(args.search, args.limit)
        print(f"Found {len(urls)} URLs")
    else:
        parser.print_help()
        return

    for url in urls:
        print(f"Crawling: {url}")
        result = fetch_page(url)
        if result:
            save_result(result)
            print(f"  ✓ {result['title'][:60]}")
        time.sleep(1)

    print(f"\nDone. Results in {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
