"""Briefing Agent — generates professional VC investment memos.

This agent takes a specific company and produces a structured investment
memo with executive summary, market analysis, team assessment, investment
thesis, risk analysis, and recommendation.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.llm import invoke_with_fallback
from app.models import AgentState
from app.tools.startupwiki import get_company_profile

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


async def briefing_agent(state: AgentState) -> dict:
    """Generate an investment memo for a specific company."""
    company_id = state.company_id

    if not company_id:
        return {
            "briefing_result": "No company specified. Please select a company to generate a briefing."
        }

    system_prompt = _build_system_prompt(company_id)

    if "not found" in system_prompt.lower():
        return {"briefing_result": system_prompt}

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Generate the investment memo."),
    ]

    logger.info("Briefing agent running for company: %s", company_id)

    try:
        content, model = await invoke_with_fallback(messages)
        return {"briefing_result": content, "model_used": model}
    except Exception as e:
        logger.error("Briefing agent failed: %s", e)
        return {
            "briefing_result": "Failed to generate the investment memo. Please try again."
        }
