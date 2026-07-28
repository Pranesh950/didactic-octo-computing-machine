"""Configuration loaded from environment variables with sensible defaults."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # NVIDIA NIM API (OpenAI-compatible)
    api_base_url: str = os.getenv(
        "LLM_API_BASE_URL",
        "https://integrate.api.nvidia.com/v1",
    )
    api_key: str = os.getenv("LLM_API_KEY", "")
    primary_model: str = os.getenv(
        "LLM_PRIMARY_MODEL",
        "meta/llama-3.1-70b-instruct",
    )
    fallback_model: str = os.getenv(
        "LLM_FALLBACK_MODEL",
        "meta/llama-3.1-8b-instruct",
    )
    max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", "4096"))
    temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))


config = Config()
