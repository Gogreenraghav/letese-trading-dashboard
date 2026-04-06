"""
LETESE● LLM Gateway — Modular Provider Switching
Supports: OpenAI, Anthropic, Ollama (local Mac Mini M4)
Cost Optimization: QUALITY | BALANCED | ECONOMY
"""
import httpx
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class LLMResponse:
    text: str
    tokens_input: int
    tokens_output: int
    model: str
    provider: str


class BaseLLMProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str, system: str = "", max_tokens: int = 2000) -> LLMResponse:
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        import openai
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model

    async def complete(self, prompt: str, system: str = "", max_tokens: int = 2000) -> LLMResponse:
        import openai
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = await self.client.chat.completions.create(
            model=self.model, messages=messages, max_tokens=max_tokens)
        return LLMResponse(
            text=resp.choices[0].message.content,
            tokens_input=resp.usage.prompt_tokens,
            tokens_output=resp.usage.completion_tokens,
            model=self.model, provider="openai")


class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    async def complete(self, prompt: str, system: str = "", max_tokens: int = 2000) -> LLMResponse:
        resp = await self.client.messages.create(
            model=self.model, max_tokens=max_tokens,
            system=system or "You are a helpful legal assistant.",
            messages=[{"role": "user", "content": prompt}])
        return LLMResponse(
            text=resp.content[0].text,
            tokens_input=resp.usage.input_tokens,
            tokens_output=resp.usage.output_tokens,
            model=self.model, provider="anthropic")


class OllamaProvider(BaseLLMProvider):
    """Local LLM — Mac Mini M4 or Ubuntu GPU server."""
    def __init__(self, base_url: str = "http://mac-mini-m4:11434", model: str = "llama3:8b"):
        self.base_url = base_url
        self.model = model

    async def complete(self, prompt: str, system: str = "", max_tokens: int = 2000) -> LLMResponse:
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": full_prompt, "stream": False})
            data = resp.json()
            text = data["response"]
            return LLMResponse(
                text=text,
                tokens_input=len(full_prompt.split()),
                tokens_output=len(text.split()),
                model=self.model, provider="ollama")


class LLMGateway:
    """
    Central gateway. Reads active provider from vendor_configs.
    QUALITY  → Always primary premium model
    BALANCED → Primary for drafting; cheapest for summaries
    ECONOMY  → Ollama where available; fallback to cheapest
    """
    _providers: dict[str, BaseLLMProvider] = {}
    _config: dict = {}
    _initialized: bool = False

    @classmethod
    async def initialize(cls, config: dict):
        cls._config = config
        openai_cfg = config.get("openai", {})
        anthropic_cfg = config.get("anthropic", {})
        ollama_cfg = config.get("ollama", {})

        if openai_cfg.get("api_key"):
            cls._providers["openai"] = OpenAIProvider(
                openai_cfg["api_key"],
                openai_cfg.get("default_model", "gpt-4o-mini"))
        if anthropic_cfg.get("api_key"):
            cls._providers["anthropic"] = AnthropicProvider(
                anthropic_cfg["api_key"],
                anthropic_cfg.get("default_model", "claude-3-5-sonnet-20241022"))
        if ollama_cfg.get("enabled"):
            cls._providers["ollama"] = OllamaProvider(
                ollama_cfg.get("base_url", "http://mac-mini-m4:11434"),
                ollama_cfg.get("model", "llama3:8b"))

        cls._initialized = True

    @classmethod
    async def complete(
        cls,
        prompt: str,
        system: str = "",
        task_type: str = "general",
        max_tokens: int = 2000,
        force_provider: Optional[str] = None,
    ) -> LLMResponse:
        if not cls._initialized:
            return LLMResponse(text="[LLM Gateway not initialized]", tokens_input=0, tokens_output=0,
                               model="unknown", provider="none")

        mode = cls._config.get("cost_optimization_mode", "BALANCED")
        active = cls._config.get("active_provider", "openai")
        fallback = cls._config.get("fallback_provider", "ollama")
        ollama_on = cls._config.get("ollama", {}).get("enabled", False)

        if force_provider:
            provider_key = force_provider
        elif mode == "QUALITY":
            provider_key = active
        elif mode == "ECONOMY":
            provider_key = "ollama" if ollama_on else active
        else:  # BALANCED
            provider_key = active if task_type in ("draft", "compliance") else \
                           ("ollama" if ollama_on else "openai")

        provider = cls._providers.get(provider_key, cls._providers.get(active))
        if not provider:
            return LLMResponse(text="[No LLM provider configured]", tokens_input=0, tokens_output=0,
                               model="none", provider="none")

        try:
            return await provider.complete(prompt, system, max_tokens)
        except Exception:
            fallback_provider = cls._providers.get(fallback, cls._providers.get(active))
            if fallback_provider:
                return await fallback_provider.complete(prompt, system, max_tokens)
            return LLMResponse(text=f"[LLM error: {e}]", tokens_input=0, tokens_output=0,
                               model="error", provider="error")
