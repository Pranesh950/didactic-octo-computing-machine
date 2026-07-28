"""Manager agent — routes tasks to specialized sub-agents via LangGraph.

This is the entrypoint node in the graph. It:
1. Analyzes user intent (research vs briefing vs general)
2. Updates the shared AgentState
3. Routes to the appropriate sub-agent node
4. Synthesizes sub-agent results into a final response
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage, SystemMessage

from app.llm import invoke_with_fallback
from app.models import AgentState

logger = logging.getLogger(__name__)

ROUTER_SYSTEM_PROMPT = """You are the Manager Agent at StartupWiki Terminal — an AI venture capital associate platform.

Your job is to analyze user queries and determine the correct intent. You do NOT answer the query directly. You only classify it.

Available intents:
- "research": User wants to search, discover, or research startups, markets, founders, or competitors. Any query about finding or analyzing companies generally.
- "briefing": User wants a detailed investment memo or analysis of a SPECIFIC company they're looking at. Only choose this when the user provides a specific company identifier or is clearly on a company page.
- "general": User is asking about the platform, making conversation, or anything that doesn't fit the above.

Respond with ONLY the intent word: research, briefing, or general."""

COMBINER_SYSTEM_PROMPT = """You are a Managing Partner at a top-tier venture capital firm, responding via StartupWiki Terminal.

You have access to research and analysis from your team of AI VC associates. Synthesize their findings into a clear, professional response.

Guidelines:
- Be direct and analytical. No fluff.
- Prioritize actionable insights over description.
- If research was done, highlight the top 2-3 findings.
- If a briefing was generated, summarize the key recommendation.
- Use a professional VC tone — think Sequoia investment memo, not a blog post.
- Keep responses concise but substantive."""


async def manager_router(state: AgentState) -> dict:
    """Manager agent: classify user intent and route to sub-agent."""
    query = state.user_query
    company_id = state.company_id

    messages = [
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=f"User query: {query}\nCompany context ID: {company_id or 'none'}"),
    ]

    intent_raw, model = await invoke_with_fallback(messages)
    intent_raw = intent_raw.strip().lower()

    if "briefing" in intent_raw and company_id:
        intent = "briefing"
    elif "briefing" in intent_raw:
        intent = "briefing"
    elif "research" in intent_raw:
        intent = "research"
    else:
        intent = "general"

    logger.info("Manager routed to intent=%s (model=%s)", intent, model)

    return {
        "intent": intent,
        "model_used": model,
        "messages": [{"role": "manager", "content": f"Routed to {intent}"}],
    }


async def manager_synthesize(state: AgentState) -> dict:
    """Manager agent: synthesize sub-agent results into final response."""
    parts: list[str] = []

    if state.research_result:
        parts.append(f"## Research Findings\n\n{state.research_result}")

    if state.briefing_result:
        parts.append(f"## Investment Briefing\n\n{state.briefing_result}")

    if not parts:
        # No sub-agents ran — handle general query directly
        return {
            "final_response": f"I'm the StartupWiki Terminal AI associate. I can help you research startups, analyze companies, and generate investment memos. What would you like to explore?",
        }

    combined = "\n\n---\n\n".join(parts)

    if len(parts) == 1:
        # Only one sub-agent result — no need for extra synthesis
        return {"final_response": combined}

    # Multiple results — synthesize
    messages = [
        SystemMessage(content=COMBINER_SYSTEM_PROMPT),
        HumanMessage(content=f"Synthesize these findings into a unified response:\n\n{combined}"),
    ]

    synthesis, model = await invoke_with_fallback(messages)

    return {
        "final_response": synthesis,
        "model_used": model,
    }
