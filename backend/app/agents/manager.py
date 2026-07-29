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

    # Try LLM-based intent classification first
    intent = None
    model = "keyword"

    try:
        messages = [
            SystemMessage(content=ROUTER_SYSTEM_PROMPT),
            HumanMessage(content=f"User query: {query}\nCompany context ID: {company_id or 'none'}"),
        ]
        intent_raw, model = await invoke_with_fallback(messages)
        intent_raw = intent_raw.strip().lower()

        if "briefing" in intent_raw:
            intent = "briefing"
        elif "research" in intent_raw:
            intent = "research"
        else:
            intent = "general"
    except Exception as e:
        logger.warning("LLM intent classification failed, using keyword fallback: %s", e)

    # Keyword-based fallback if LLM failed or returned unclear result
    if intent is None or intent == "general":
        intent = _keyword_intent(query, company_id)

    logger.info("Manager routed to intent=%s (model=%s)", intent, model)

    return {
        "intent": intent,
        "model_used": model,
        "messages": [{"role": "manager", "content": f"Routed to {intent}"}],
    }


def _keyword_intent(query: str, company_id: str | None) -> str:
    """Simple keyword-based intent detection as fallback."""
    q = query.lower()

    # If viewing a specific company page, it's briefing
    if company_id:
        return "briefing"

    # briefing keywords — user specifically asking for an investment memo
    briefing_keywords = [
        "briefing", "brief me on", "memo", "report on", " report",
        "deep dive", "investment memo", "analyze ",
    ]
    if any(kw in q for kw in briefing_keywords):
        return "briefing"

    # research keywords — very broad: any startup/VC/investor/tech question
    research_keywords = [
        "find", "search", "discover", "list", "show me",
        "startups", "companies", "market", "landscape",
        "sector", "industry", "trends", "competitors",
        "compare", "looking for", "opportunities",
        "ai", "robotics", "biotech", "climate", "fintech",
        "who is", "what is", "what are", "how does",
        "explain", "tell me", "vc", "venture",
        "investor", "accelerator", "incubator", "fund",
        "yc", "y combinator", "techstars", "sequoia",
        "a16z", "benchmark", "founders fund",
    ]
    if any(kw in q for kw in research_keywords):
        return "research"

    return "general"


async def manager_synthesize(state: AgentState) -> dict:
    """Manager agent: synthesize sub-agent results into final response."""
    # Preserve greeting responses from general_handler (don't overwrite)
    if state.final_response:
        return {}

    parts: list[str] = []

    if state.research_result:
        parts.append(f"## Research Findings\n\n{state.research_result}")

    if state.briefing_result:
        parts.append(f"## Investment Briefing\n\n{state.briefing_result}")

    if not parts:
        return {
            "final_response": "I'm the StartupWiki Terminal AI associate. I can help you research startups, analyze companies, and generate investment memos. What would you like to explore?",
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

    try:
        synthesis, model = await invoke_with_fallback(messages)
    except Exception:
        # LLM down — return the combined raw results
        return {"final_response": combined}

    return {
        "final_response": synthesis,
        "model_used": model,
    }
