"""Pydantic models for the StartupWiki API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ── Request ──────────────────────────────────────────────

class AgentRequest(BaseModel):
    query: str = Field(
        ...,
        description="Natural language query from the user.",
        min_length=1,
    )
    company_id: str | None = Field(
        default=None,
        description="Company ID when the user is viewing a specific company.",
    )


# ── LangGraph Agent State ─────────────────────────────────

class AgentState(BaseModel):
    """State that flows through the LangGraph agent graph."""

    messages: list[dict] = Field(default_factory=list)
    user_query: str = ""
    intent: Literal["research", "briefing", "general"] | None = None
    company_id: str | None = None
    research_result: str | None = None
    briefing_result: str | None = None
    final_response: str | None = None
    model_used: str = ""
    error: str | None = None


# ── Response ─────────────────────────────────────────────

class AgentResponse(BaseModel):
    response: str = Field(..., description="Final agent response.")
    intent: str | None = None
    model_used: str = ""
    sub_agents: list[str] = Field(default_factory=list)
