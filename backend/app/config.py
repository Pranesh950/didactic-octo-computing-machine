"""Configuration loaded from environment variables with sensible defaults."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # NVIDIA NIM API
    api_base_url: str = os.getenv(
        "NIM_API_BASE_URL",
        "https://integrate.api.nvidia.com/v1",
    )
    api_key: str = os.getenv("NIM_API_KEY", "")
    primary_model: str = os.getenv(
        "NIM_PRIMARY_MODEL",
        "meta/llama-3.3-70b-instruct",
    )
    fallback_model: str = os.getenv(
        "NIM_FALLBACK_MODEL",
        "meta/llama-3.1-8b-instruct",
    )
    max_tokens: int = int(os.getenv("NIM_MAX_TOKENS", "4096"))
    temperature: float = float(os.getenv("NIM_TEMPERATURE", "0.0"))


config = Config()
