"""StartupWiki Terminal — FastAPI server with LangGraph agent orchestration.

This is the backend API that powers the StartupWiki Terminal frontend.
All AI agent logic runs server-side via LangGraph, with the NVIDIA NIM
API providing the underlying LLM.

Endpoints:
  POST /api/agent         — Full agent graph execution (research, briefing)
  POST /api/agent/stream  — Streaming agent execution (SSE)
  GET  /api/companies     — List all companies (for frontend reference)
  GET  /health             — Health check
"""

from __future__ import annotations

import logging
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.models import AgentRequest, AgentResponse
from app.graph import run_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StartupWiki Terminal API",
    description="LangGraph-powered AI VC Associate for startup intelligence",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://startupwikiterminal.web.app",
        "https://startupwikiterminal.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Main agent endpoint ──────────────────────────────────

@app.post("/api/agent", response_model=AgentResponse)
async def agent_endpoint(req: AgentRequest):
    """Run the full agent graph on a user query.

    The Manager agent routes to Research or Briefing sub-agents based
    on intent, then synthesizes results into a final response.
    """
    try:
        state = await run_graph(req.query, req.company_id)
    except Exception as e:
        logger.exception("Agent graph failed")
        raise HTTPException(status_code=500, detail=str(e))

    if state.error:
        raise HTTPException(status_code=500, detail=state.error)

    return AgentResponse(
        response=state.final_response or "No response generated.",
        intent=state.intent,
        model_used=state.model_used or "",
        sub_agents=_determine_sub_agents(state),
    )


# ── Streaming agent endpoint ─────────────────────────────

@app.post("/api/agent/stream")
async def agent_stream(req: AgentRequest):
    """Run the agent graph and stream the response via SSE."""
    async def event_stream():
        try:
            yield f"data: {json.dumps({'type': 'intent_detected', 'intent': 'analyzing'})}\n\n"

            state = await run_graph(req.query, req.company_id)

            if state.error:
                yield f"data: {json.dumps({'type': 'error', 'message': state.error})}\n\n"
                return

            response_text = state.final_response or "No response generated."

            # Stream the response token by token (simulated word chunks)
            words = response_text.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i : i + 3]) + " "
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'complete', 'model_used': state.model_used or '', 'intent': state.intent})}\n\n"

        except Exception as e:
            logger.exception("Stream failed")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Companies endpoint ───────────────────────────────────

@app.get("/api/companies")
async def list_companies():
    """Return all companies in the database."""
    from app.tools.startupwiki import STARTUPS
    return {"companies": STARTUPS}


# ── Health check ─────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "startupwiki-backend", "version": "0.1.0"}


# ── Helpers ──────────────────────────────────────────────

def _determine_sub_agents(state) -> list[str]:
    """Determine which sub-agents ran based on state."""
    agents = ["manager"]
    if state.research_result:
        agents.append("research")
    if state.briefing_result:
        agents.append("briefing")
    return agents
