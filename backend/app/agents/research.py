"""Research Agent — genuine VC research pipeline with live web search.

Performs multi-step analysis:
1. Data Gathering — internal DB + live web/News search
2. Market Analysis — TAM, growth rates, competitive landscape
3. Team Assessment — founder backgrounds, founder-market fit
4. Funding & Traction — round history, investor quality, milestones
5. Investment Thesis — bull case, risks, recommendation

Works with or without the LLM — falls back to a deterministic pipeline
using Serper API and database tools when the LLM is unavailable.
"""

from __future__ import annotations

import asyncio
import logging

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from app.llm import get_primary_llm
from app.models import AgentState
from app.tools.startupwiki import RESEARCH_TOOLS, _search_startups_scored
from app.pipelines.memo_builder import build_full_memo
from app.data.mock_db import STARTUPS
logger = logging.getLogger(__name__)

# Import Serper tools gracefully — degrade if httpx is unavailable
try:
    from app.tools.serper import SERPER_TOOLS, serper_web_search, serper_news_search
    ALL_RESEARCH_TOOLS = RESEARCH_TOOLS + SERPER_TOOLS
except ImportError:
    logger.warning("Serper tools unavailable — install httpx for web search")
    SERPER_TOOLS = []
    serper_web_search = None  # type: ignore
    serper_news_search = None  # type: ignore
    ALL_RESEARCH_TOOLS = RESEARCH_TOOLS

VC_RESEARCH_PROMPT = """You are a Partner-level VC research analyst at a top-tier venture capital firm. You have access to:

1. **StartupWiki database** — internal data on pre-vetted startups
2. **Live web search** — real-time internet research on companies, markets, and founders
3. **News search** — recent articles about funding, product launches, and industry trends

Your job is to research comprehensively and produce a structured VC investment memo.

RESEARCH PROCESS:
1. Start by searching the internal database for the company or sector
2. Use web search for market data (TAM, growth rates, industry reports)
3. Use news search for recent funding rounds, product launches, team moves
4. For each founder mentioned, search their background
5. Analyze the competitive landscape using web search
6. Synthesize everything into a professional VC memo

OUTPUT FORMAT — always structure your response as:

## 1. Executive Summary
[One paragraph: what the company does, its unique differentiator, and the core investment thesis]

## 2. Market Dynamics
- **TAM/SAM**: [Market size and growth rate]
- **Industry Tailwinds**: [Why now is the time for this category]
- **Competitive Landscape**: [Key competitors and how this company differs]

## 3. Team Assessment
- **Founder Backgrounds**: [Relevant experience, previous exits, domain expertise]
- **Founder-Market Fit**: [Why this team is uniquely positioned to win]

## 4. Deal Dynamics & Traction
- **Funding History**: [Rounds, amounts, lead investors — quality signals]
- **Recent Milestones**: [Product launches, partnerships, hiring velocity]
- **Growth Signals**: [Revenue, user growth, or other traction indicators]

## 5. Investment Thesis
- **Bull Case**: [What needs to go right for a 10x+ return]
- **Key Risks**: [Top 3 threats to the investment]
- **Recommendation**: [High Conviction / Buy / Monitor / Pass]

Be data-driven, analytical, and direct. Every claim should be backed by specific data. Think like a Sequoia partner writing a pre-partnership memo."""


async def research_agent(state: AgentState) -> dict:
    """Run the full VC research pipeline with tools."""
    query = state.user_query
    company_id = state.company_id

    # Build ReAct agent with all tools (DB + web search)
    llm = get_primary_llm(temperature=0.0)
    agent = create_react_agent(llm, ALL_RESEARCH_TOOLS)

    # Augment query with VC context
    research_query = query
    if company_id:
        research_query = (
            f"Research this company comprehensively and produce a full VC investment memo. "
            f"Company ID: {company_id}. Original query: {query}. "
            f"Use web search for market data, news, and founder backgrounds. "
            f"Use the database for internal company data."
        )

    messages = [
        SystemMessage(content=VC_RESEARCH_PROMPT),
        HumanMessage(content=research_query),
    ]

    logger.info("VC Research agent running for: %s", query[:120])

    try:
        result = await agent.ainvoke({"messages": messages})
        final_messages = result.get("messages", [])
        response = ""
        for msg in reversed(final_messages):
            if hasattr(msg, "content") and msg.content:
                response = msg.content
                break

        if not response or len(response) < 100:
            response = await _deterministic_research(query, company_id)

        return {"research_result": response}
    except Exception as e:
        logger.error("LLM research failed, using deterministic pipeline: %s", e)
        response = await _deterministic_research(query, company_id)
        return {"research_result": response}


# ── Deterministic Pipeline (no LLM required) ──────────────

async def _deterministic_research(query: str, company_id: str | None) -> str:
    """Run a multi-step research pipeline without the LLM.

    Uses Serper API + database tools directly to gather and structure
    information into a VC memo format. Searches run in parallel via threads.
    """
    # Step 1: Find the company (from ID, query, or database)
    company = _resolve_company(query, company_id)
    company_name = company["name"] if company else _extract_company_name(query)

    # Step 2: Gather data in parallel using threads (LangChain invoke() is sync)
    loop = asyncio.get_running_loop()
    db_profile, web_results, news_results, market_results = await asyncio.gather(
        loop.run_in_executor(None, _gather_db_profile, company),
        loop.run_in_executor(None, _search_web, f"{company_name} startup company funding team"),
        loop.run_in_executor(None, _search_news, f"{company_name} funding round raised announced"),
        loop.run_in_executor(None, _search_web, f"{company_name} market size TAM industry growth"),
    )

    # Step 3: Build the memo from gathered data
    return build_full_memo(
        company=company,
        company_name=company_name,
        web_results=web_results or "",
        news_results=news_results or "",
        market_results=market_results or "",
        query=query,
    )


def _resolve_company(query: str, company_id: str | None) -> dict | None:
    """Find the company being researched."""
    if company_id:
        for c in STARTUPS:
            if c["id"] == company_id:
                return c

    scored = _search_startups_scored(query)
    if scored:
        return scored[0][1]
    return None


def _extract_company_name(query: str) -> str:
    """Extract a likely company name from a query."""
    # Use the database search to find the best match
    scored = _search_startups_scored(query)
    if scored:
        return scored[0][1]["name"]
    # Fallback: use first 4 words of query
    return " ".join(query.split()[:4])


def _gather_db_profile(company: dict | None) -> str:
    """Get the full database profile for a company."""
    if not company:
        return ""
    from app.tools.startupwiki import _format_company_detailed
    return _format_company_detailed(company)


def _search_web(query: str) -> str:
    """Search the web via Serper."""
    try:
        return serper_web_search.invoke({"query": query})
    except Exception as e:
        logger.warning("Web search failed: %s", e)
        return "[Web search unavailable]"


def _search_news(query: str) -> str:
    """Search news via Serper."""
    try:
        return serper_news_search.invoke({"query": query})
    except Exception as e:
        logger.warning("News search failed: %s", e)
        return "[News search unavailable]"

