"""Research Agent — searches StartupWiki, analyzes markets, finds companies.

This agent handles all research-oriented queries: startup discovery,
market analysis, competitor research, founder analysis, etc.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent

from app.llm import get_primary_llm
from app.models import AgentState
from app.tools.startupwiki import RESEARCH_TOOLS

logger = logging.getLogger(__name__)

RESEARCH_SYSTEM_PROMPT = """You are the Research Agent at StartupWiki Terminal — an AI analyst for venture capital investors.

You have access to a database of startups. Your job is to research and analyze.

CAPABILITIES:
- Search for startups by name, industry, technology, or keywords
- Get detailed company profiles
- List all companies in the database
- Analyze markets and identify trends

When responding:
1. Search the database first — use your tools to find relevant companies
2. Analyze the results — identify patterns, standout companies, market themes
3. Present findings clearly — structure your response with clear sections
4. Be data-driven — reference specific companies, funding amounts, and facts
5. Think like a VC — what matters is growth potential, team quality, market timing

Always use the available tools to ground your analysis in real data. If the database doesn't have enough information, be honest about the limitations."""


async def research_agent(state: AgentState) -> dict:
    """Run the research agent with database tools."""
    query = state.user_query

    # Build the ReAct agent with tools
    llm = get_primary_llm(temperature=0.0)
    agent = create_react_agent(llm, RESEARCH_TOOLS)

    messages = [
        SystemMessage(content=RESEARCH_SYSTEM_PROMPT),
        HumanMessage(content=query),
    ]

    logger.info("Research agent running for query: %s", query[:100])

    try:
        result = await agent.ainvoke({"messages": messages})
        # Extract the final AI message
        final_messages = result.get("messages", [])
        response = ""
        for msg in reversed(final_messages):
            if hasattr(msg, "content") and msg.content:
                response = msg.content
                break

        if not response:
            response = _build_fallback_research_response(query)

        return {"research_result": response}
    except Exception as e:
        logger.error("Research agent failed, using fallback: %s", e)
        return {
            "research_result": _build_fallback_research_response(query)
        }


def _build_fallback_research_response(query: str) -> str:
    """Build a database-driven response when the LLM is unavailable."""
    from app.tools.startupwiki import STARTUPS

    q = query.lower()
    matches = []

    for s in STARTUPS:
        score = 0
        name = s.get("name", "").lower()
        desc = s.get("description", "").lower()
        industry = s.get("industry", "").lower()
        tags = " ".join(s.get("tags", [])).lower()
        tech = " ".join(s.get("technology", [])).lower()

        for word in q.split():
            if word in name: score += 3
            if word in desc: score += 2
            if word in industry: score += 2
            if word in tags: score += 1
            if word in tech: score += 1

        if score > 0:
            matches.append((score, s))

    matches.sort(key=lambda x: x[0], reverse=True)

    if not matches:
        names = ", ".join(s["name"] for s in STARTUPS[:5])
        return (
            f"## Research Results\n\n"
            f"I searched the database for \"{query}\" but didn't find exact matches. "
            f"Here are some companies in our database you might find relevant: {names}.\n\n"
            f"Try searching by industry (AI, Biotech, Climate, Fintech, Robotics) or use the Discover tab to browse all companies."
        )

    parts = []
    for _, s in matches[:5]:
        funding = s.get("total_funding", 0)
        parts.append(
            f"### {s['name']}\n"
            f"**{s.get('stage', 'N/A')} | {s.get('industry', 'N/A')} | Founded {s.get('founded', 'N/A')}**\n\n"
            f"{s.get('description', '')}\n\n"
            f"- Total Funding: ${funding/1_000_000:.0f}M\n"
            f"- Employees: {s.get('employeeCount', 'N/A')}\n"
            f"- HQ: {s.get('headquarters', 'N/A')}\n"
        )

    return (
        f"## Research Results for \"{query}\"\n\n"
        f"Found {len(matches)} matching companies. Here are the top results:\n\n"
        + "\n---\n\n".join(parts)
    )
