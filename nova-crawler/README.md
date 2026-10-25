# Nova Search Crawler

Member 5 — Search Engineer

## Setup
```bash
pip install -r requirements.txt
```

## Usage
```bash
# Crawl single page
python crawler.py --url https://wikipedia.org

# Search + crawl top results
python crawler.py --search "nova browser privacy" --limit 5
```

## Output
`crawl_index.jsonl` — one JSON object per line, ready for OpenSearch/PostgreSQL import.

## Next Steps (Team)
1. Schedule crawler with cron / Celery
2. Import `crawl_index.jsonl` into PostgreSQL `search_index` table
3. Replace DuckDuckGo in `nova-cloud/src/routes/search.js`
