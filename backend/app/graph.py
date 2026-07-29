"""LangGraph state graph — orchestrates the multi-agent system.

Graph structure:

    START
      │
      ▼
  ┌──────────┐        ┌────────────┐        ┌───────────────┐
  │ Manager  │───┬───►│ Research   │───┬───►│ Manager       │
  │ Router   │   │    │ Agent      │   │    │ Synthesizer   │──► END
  └──────────┘   │    └────────────┘   │    └───────────────┘
                 │                     │
                 │    ┌────────────┐   │
                 ├───►│ Briefing   │───┤
                 │    │ Agent      │   │
                 │    └────────────┘   │
                 │                     │
                 │    ┌────────────┐   │
                 └───►│ General    │───┘
                      │ (direct)   │
                      └────────────┘

The Manager Router classifies intent. Research/Briefing agents run their
specialized logic. The Manager Synthesizer combines results into the
final response.

This is the real architecture: hierarchical AI agents, not a chatbot.
"""

from __future__ import annotations

import logging
from typing import Literal

from langgraph.graph import StateGraph, END

from app.models import AgentState
from app.agents.manager import manager_router, manager_synthesize
from app.agents.research import research_agent
from app.agents.briefing import briefing_agent

logger = logging.getLogger(__name__)


# ── Routing functions ────────────────────────────────────

async def router_decide(state: AgentState) -> Literal["research", "briefing", "general"]:
    """After the manager router classifies intent, decide which node to execute next."""
    intent = state.intent or "general"

    if intent == "research":
        return "research"
    elif intent == "briefing" and state.company_id:
        return "briefing"
    elif intent == "briefing":
        # User asked for briefing but no company_id — try research instead
        return "research"
    else:
        return "general"


# ── General handler ──────────────────────────────────────

async def general_handler(state: AgentState) -> dict:
    """Handle general queries by falling through to the research agent.

    There are no truly "general" questions — if someone asks anything,
    we should try to research it. Returns a research_result so the
    synthesizer picks it up.
    """
    query = state.user_query.strip()
    q = query.lower()

    # Short greeting — no need to research
    if len(q) < 10 and any(g in q for g in ["hi", "hello", "hey", "yo", "sup", "thanks", "ok"]):
        return {
            "final_response": "Hey! I'm your StartupWiki Terminal AI associate. Ask me to research any startup, market, or investment topic.",
            "intent": "general",
        }

    # Route everything else through the research agent by setting intent
    # so the router re-evaluates
    return {
        "intent": "research",
        "final_response": None,
    }


# ── Build the graph ──────────────────────────────────────

def build_graph() -> StateGraph:
    """Build and compile the StartupWiki agent graph."""

    workflow = StateGraph(AgentState)

    # Nodes
    workflow.add_node("manager_router", manager_router)
    workflow.add_node("research", research_agent)
    workflow.add_node("briefing", briefing_agent)
    workflow.add_node("general", general_handler)
    workflow.add_node("synthesize", manager_synthesize)

    # Edges
    workflow.set_entry_point("manager_router")

    # Router → sub-agents based on intent
    workflow.add_conditional_edges(
        "manager_router",
        router_decide,
        {
            "research": "research",
            "briefing": "briefing",
            "general": "general",
        },
    )

    # Sub-agents → synthesizer
    workflow.add_edge("research", "synthesize")
    workflow.add_edge("briefing", "synthesize")

    # General handler → research → synthesizer (try to research everything)
    workflow.add_edge("general", "research")

    # Synthesizer → END
    workflow.add_edge("synthesize", END)

    return workflow.compile()


# Singleton
_agent_graph = build_graph()


async def run_graph(query: str, company_id: str | None = None) -> AgentState:
    """Run the full agent graph on a user query.

    This is the main entrypoint for the API. It invokes the LangGraph
    graph with the user's query and returns the final state.
    """
    initial_state = AgentState(
        user_query=query,
        company_id=company_id,
    )

    logger.info(
        "Running agent graph | query=%s | company=%s",
        query[:80],
        company_id,
    )

    result = await _agent_graph.ainvoke(initial_state)
    return AgentState(**result)
