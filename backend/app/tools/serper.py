"""Serper.dev web search tools for live internet research.

Provides real-time web and news search so the VC research agent can
gather live data on companies, markets, founders, and competitors.

Requires: SERPER_API_KEY environment variable (free tier: 2,500 searches/month)
Get a key at: https://serper.dev
"""

from __future__ import annotations

import os
import json
import logging
from typing import Any

import httpx
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
SERPER_URL = "https://google.serper.dev/search"
SERPER_NEWS_URL = "https://google.serper.dev/news"


def _serper_search(query: str, search_type: str = "search", num: int = 5) -> list[dict[str, str]]:
    """Core Serper API caller. Returns list of {title, link, snippet} dicts.

    This is the shared data layer — both the LangChain tool formatter and
    the research agent's snippet extractor consume this structured output.
    """
    if not SERPER_API_KEY:
        logger.warning("SERPER_API_KEY not set — web search disabled")
        return []

    url = SERPER_URL if search_type == "search" else SERPER_NEWS_URL
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    payload = {"q": query, "num": num}

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=15.0)
        response.raise_for_status()
        data = response.json()

        results = []
        items = data.get("organic") if search_type == "search" else data.get("news", [])
        for item in items[:num]:
            results.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", ""),
            })
        return results
    except Exception as e:
        logger.error("Serper %s search failed: %s", search_type, e)
        return []


def _format_search_results(results: list[dict[str, str]], query: str) -> str:
    """Format Serper results into readable text."""
    if not results:
        return f"[Web search unavailable — no SERPER_API_KEY set]\nTry: 'export SERPER_API_KEY=your_key' or get one at https://serper.dev"

    lines = [f"Web results for \"{query}\":\n"]
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. **{r['title']}**\n   {r['snippet']}\n   {r['link']}\n")
    return "\n".join(lines)


# ── LangChain Tools ──────────────────────────────────────

@tool
def serper_web_search(query: str) -> str:
    """Search the web for live information about companies, markets, founders, or industries.

    Use this to find:
    - Company websites, product info, recent news
    - Market size data (TAM, growth rates, industry reports)
    - Founder backgrounds, LinkedIn profiles, previous companies
    - Competitive landscape and industry analysis
    - Funding announcements and investor information

    Args:
        query: What to search for (e.g., 'Neural Labs AI infrastructure funding 2025')
    """
    results = _serper_search(query, "search", num=5)
    return _format_search_results(results, query)


@tool
def serper_news_search(query: str) -> str:
    """Search recent news articles about companies, funding rounds, or market events.

    Use this to find:
    - Recent funding announcements and round details
    - Product launches and partnership news
    - Executive hires and team changes
    - Industry trends and market developments

    Args:
        query: What news to search for (e.g., 'RoboSynth robotics funding round')
    """
    results = _serper_search(query, "news", num=5)
    if not results:
        return "[News search unavailable — no SERPER_API_KEY set]\nTry: 'export SERPER_API_KEY=your_key' or get one at https://serper.dev"
    return _format_search_results(results, query)


# Export structured search for agents that need raw data
serper_search_raw = _serper_search
