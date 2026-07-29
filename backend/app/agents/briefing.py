"""Briefing Agent — generates professional VC investment memos.

This agent takes a specific company and produces a structured investment
memo with executive summary, market analysis, team assessment, investment
thesis, risk analysis, and recommendation.
Fallback: searches the startup database when the LLM is unavailable.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.llm import invoke_with_fallback
from app.models import AgentState
from app.tools.startupwiki import get_company_profile, STARTUPS

logger = logging.getLogger(__name__)


def _build_system_prompt(company_id: str) -> str:
    """Build the briefing system prompt with company data."""
    profile = get_company_profile.invoke({"company_id": company_id})

    return f"""You are a Partner-level VC analyst at a top-tier venture capital firm. Your task is to write a professional investment memo about a startup.

Write in a crisp, analytical, and data-driven style. No fluff. No filler. Every sentence should carry weight.

COMPANY DATA:
{profile}

FORMAT your response as a professional investment memo with these EXACT sections:

## Executive Summary
[One crisp paragraph: what the company does, why it matters, key differentiator. 2-3 sentences.]

## Market Analysis
[Market size context, tailwinds, competitive positioning. 2-3 sentences.]

## Team Assessment
[Assessment of founder-market fit, relevant experience, gaps. 2-3 sentences.]

## Investment Thesis
[Why this company could be a venture-scale outcome. What needs to go right. 2-3 sentences.]

## Risk Analysis
[Key risks ranked by severity. What could go wrong. 2-3 sentences.]

## Recommendation
[One of: Strong Buy / Buy / Hold / Pass — with 1 sentence justification.]

Be professional, analytical, and direct. Use a VC partner's voice. No hedging, no consulting-speak."""


def _find_company_from_query(query: str) -> str | None:
    """Try to find a company ID by matching the query against the database."""
    q = query.lower()
    best_score = 0
    best_id = None

    for s in STARTUPS:
        score = 0
        name = s.get("name", "").lower()
        if name in q or q in name:
            score += 5
        for word in q.split():
            if word in name:
                score += 2
        if score > best_score:
            best_score = score
            best_id = s.get("id")

    return best_id if best_score >= 3 else None


def _build_fallback_briefing(query: str, company_id: str | None) -> str:
    """Build a database-driven briefing when the LLM is unavailable."""
    # Try to find the company
    found_id = company_id or _find_company_from_query(query)

    if not found_id:
        # Suggest companies from database
        names = ", ".join(s["name"] for s in STARTUPS[:5])
        return (
            f"## Company Not Found\n\n"
            f"I couldn't find a company matching \"{query[:80]}\" in the database.\n\n"
            f"**Companies I can brief you on:**\n\n" +
            "\n".join(
                f"- **{s['name']}** — {s.get('description', '')} ({s.get('stage', '')}, {s.get('industry', '')})"
                for s in STARTUPS
            ) +
            f"\n\nVisit the **Discover** tab to browse all companies, or try a briefing on one of these."
        )

    profile = get_company_profile.invoke({"company_id": found_id})

    if "not found" in profile.lower():
        return (
            f"## Company Not Found\n\n"
            f"Unable to load data for this company. Try one of these instead:\n\n" +
            "\n".join(f"- **{s['name']}**" for s in STARTUPS[:5])
        )

    return (
        f"## Investment Briefing — Query-based\n\n"
        f"*Note: This briefing was generated from our database without AI analysis. The LLM service is currently unavailable.*\n\n"
        f"{profile}\n\n"
        f"---\n\n"
        f"**Companies in database:** {', '.join(s['name'] for s in STARTUPS)}\n\n"
        f"For a full AI-powered analysis, try again later when the LLM service is back online."
    )


async def briefing_agent(state: AgentState) -> dict:
    """Generate an investment memo for a specific company."""
    company_id = state.company_id
    query = state.user_query

    # Try to find company from query if no company_id
    if not company_id:
        found = _find_company_from_query(query)
        if found:
            company_id = found
            logger.info("Briefing agent found company from query: %s → %s", query[:60], company_id)

    if not company_id:
        return {
            "briefing_result": (
                f"I need a specific company to generate a briefing. "
                f"Try: \"brief me on Neural Labs\" or \"analyze RoboSynth\". "
                f"Available companies: {', '.join(s['name'] for s in STARTUPS[:5])}."
            )
        }

    system_prompt = _build_system_prompt(company_id)

    if "not found" in system_prompt.lower():
        return {"briefing_result": _build_fallback_briefing(query, company_id)}

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Generate the investment memo."),
    ]

    logger.info("Briefing agent running for company: %s", company_id)

    try:
        content, model = await invoke_with_fallback(messages)
        return {"briefing_result": content, "model_used": model}
    except Exception as e:
        logger.error("Briefing agent LLM failed, using fallback: %s", e)
        return {"briefing_result": _build_fallback_briefing(query, company_id)}
