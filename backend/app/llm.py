"""OpenAI-compatible LLM client with automatic model fallback.

Uses langchain-openai's ChatOpenAI pointed at any OpenAI-compatible endpoint
(MiniMax, NVIDIA NIM, OpenAI, Ollama, etc.).
Falls back from primary model to fallback on failure.
"""

import logging
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage

from app.config import config

logger = logging.getLogger(__name__)


def _build_llm(model: str, **overrides: Any) -> ChatOpenAI:
    """Build a ChatOpenAI instance pointed at NVIDIA NIM."""
    return ChatOpenAI(
        model=model,
        base_url=config.api_base_url,
        api_key=config.api_key,
        temperature=overrides.get("temperature", config.temperature),
        max_tokens=overrides.get("max_tokens", config.max_tokens),
        streaming=overrides.get("streaming", False),
    )


def get_primary_llm(**overrides: Any) -> ChatOpenAI:
    """Get the primary (most capable) model — Llama 3.1 70B."""
    return _build_llm(config.primary_model, **overrides)


def get_fallback_llm(**overrides: Any) -> ChatOpenAI:
    """Get the fallback model — Llama 3.1 8B (lightweight, free on NVIDIA NIM)."""
    return _build_llm(config.fallback_model, **overrides)


async def invoke_with_fallback(
    messages: list[BaseMessage],
    **overrides: Any,
) -> tuple[str, str]:
    """Invoke the LLM with automatic fallback.

    Tries the primary model first. Falls back on failure.

    Returns:
        (content, model_used) tuple.
    """
    # Try primary
    try:
        llm = get_primary_llm(**overrides)
        response = await llm.ainvoke(messages)
        content = _extract_content(response)
        return content, config.primary_model
    except Exception as e:
        logger.warning(
            "Primary model %s failed: %s. Falling back to %s.",
            config.primary_model,
            e,
            config.fallback_model,
        )

    # Try fallback
    try:
        llm = get_fallback_llm(**overrides)
        response = await llm.ainvoke(messages)
        content = _extract_content(response)
        return content, config.fallback_model
    except Exception as e:
        raise RuntimeError(
            f"Both primary ({config.primary_model}) and fallback "
            f"({config.fallback_model}) models failed."
        ) from e


async def stream_with_fallback(
    messages: list[BaseMessage],
    **overrides: Any,
):
    """Stream from the LLM with automatic fallback.

    Yields content tokens. Falls back to non-streaming on failure.

    Returns:
        (async_generator yielding str tokens, model_used: str)
    """
    model_used = config.primary_model

    # Try primary streaming
    try:
        llm = get_primary_llm(streaming=True, **overrides)
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content
        return
    except Exception as e:
        logger.warning(
            "Primary streaming failed: %s. Trying fallback streaming.", e
        )

    # Try fallback streaming
    model_used = config.fallback_model
    try:
        llm = get_fallback_llm(streaming=True, **overrides)
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield chunk.content
        return
    except Exception as e:
        logger.warning(
            "Fallback streaming failed: %s. Using non-streaming.", e
        )

    # Last resort: non-streaming fallback
    content, model_used = await invoke_with_fallback(messages, streaming=False)
    yield content


def _extract_content(response: Any) -> str:
    """Extract text content from an LLM response."""
    if hasattr(response, "content"):
        content = response.content
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "".join(
                c.get("text", "") if isinstance(c, dict) else str(c)
                for c in content
            )
    return str(response)
