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
    """Build a database-driven response using the search tool directly."""
    from app.tools.startupwiki import search_startups, list_all_companies

    # Use the actual search tool for multi-word matching
    result = search_startups.invoke({"query": query})

    # If no results, show full database
    if "No startups found" in result:
        all_list = list_all_companies.invoke({})
        return (
            f"## Research Results\n\n"
            f"I searched for \"{query}\" but didn't find exact matches. "
            f"Here are all companies in our database:\n\n"
            f"{all_list}"
        )

    return f"## Research Results for \"{query}\"\n\n{result}"
