/**
 * OpenAI-compatible API client with model fallback.
 *
 * Supports:
 * - Standard chat completions (non-streaming)
 * - Streaming chat completions (SSE)
 * - Automatic model fallback: tries primary, falls back on failure
 * - Configurable base URL for any compatible endpoint (NVIDIA NIM, OpenAI, Ollama, etc.)
 */
import type {
  APIConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamChunk,
  ChatMessage,
  APIError as APIErrorPayload,
} from "@/types/openai";
import { getDefaultAPIConfig } from "@/types/openai";

export class OpenAIClient {
  private config: APIConfig;

  constructor(config?: Partial<APIConfig>) {
    this.config = { ...getDefaultAPIConfig(), ...config };
  }

  // ==================================================
  // Chat Completion (non-streaming)
  // ==================================================

  async chat(
    messages: ChatMessage[],
    overrides?: Partial<ChatCompletionRequest>,
  ): Promise<ChatCompletionResponse> {
    const body: ChatCompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: false,
      ...overrides,
    };

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        (error as APIErrorPayload)?.error?.message || response.statusText,
      );
    }

    return response.json();
  }

  // ==================================================
  // Chat with automatic model fallback
  // ==================================================

  /**
   * Try the primary model first. If it fails, automatically fall back
   * to the fallback model. Both must succeed — if both fail, the error
   * from the primary is thrown.
   *
   * This is the recommended method for production use.
   */
  async chatWithFallback(
    messages: ChatMessage[],
    overrides?: Partial<ChatCompletionRequest>,
  ): Promise<{ response: ChatCompletionResponse; modelUsed: string }> {
    // 1. Try primary model
    try {
      const response = await this.chat(messages, {
        ...overrides,
        model: this.config.model,
      });
      return { response, modelUsed: this.config.model };
    } catch (primaryError) {
      console.warn(
        `Primary model ${this.config.model} failed, falling back to ${this.config.fallbackModel}`,
        primaryError,
      );
    }

    // 2. Try fallback model
    try {
      const response = await this.chat(messages, {
        ...overrides,
        model: this.config.fallbackModel,
      });
      return { response, modelUsed: this.config.fallbackModel };
    } catch (fallbackError) {
      // Both failed — throw the original error
      throw new APIError(
        500,
        `Both primary (${this.config.model}) and fallback (${this.config.fallbackModel}) models failed.`,
      );
    }
  }

  // ==================================================
  // Streaming Chat Completion
  // ==================================================

  async *chatStream(
    messages: ChatMessage[],
    overrides?: Partial<ChatCompletionRequest>,
  ): AsyncGenerator<ChatCompletionStreamChunk> {
    const body: ChatCompletionRequest = {
      model: this.config.model,
      messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true,
      ...overrides,
    };

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        (error as APIErrorPayload)?.error?.message || response.statusText,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new APIError(500, "No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const chunk: ChatCompletionStreamChunk = JSON.parse(data);
            yield chunk;
          } catch {
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream-only content with automatic model fallback.
   * Tries primary model streaming first. Falls back to non-streaming
   * with the fallback model if streaming fails.
   */
  async *chatStreamContentWithFallback(
    messages: ChatMessage[],
    overrides?: Partial<ChatCompletionRequest>,
  ): AsyncGenerator<string> {
    // 1. Try primary model streaming
    try {
      for await (const chunk of this.chatStream(messages, {
        ...overrides,
        model: this.config.model,
      })) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      }
      return; // Success — exit
    } catch (primaryError) {
      console.warn(
        `Primary streaming failed (${this.config.model}), falling back to ${this.config.fallbackModel}`,
        primaryError,
      );
    }

    // 2. Fall back to non-streaming with fallback model
    const result = await this.chatWithFallback(messages, overrides);
    const content = result.response.choices[0]?.message?.content;
    if (typeof content === "string" && content) {
      // Yield the entire content at once (not streamed, but works)
      yield content;
    }
  }

  /**
   * Stream only the content text from chat completions.
   */
  async *chatStreamContent(
    messages: ChatMessage[],
    overrides?: Partial<ChatCompletionRequest>,
  ): AsyncGenerator<string> {
    for await (const chunk of this.chatStream(messages, overrides)) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  // ==================================================
  // Convenience
  // ==================================================

  async query(
    systemPrompt: string,
    userPrompt: string,
    overrides?: Partial<ChatCompletionRequest>,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    const { response } = await this.chatWithFallback(messages, overrides);
    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "";
  }

  // ==================================================
  // Helpers
  // ==================================================

  private _headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  updateConfig(partial: Partial<APIConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getConfig(): APIConfig {
    return { ...this.config };
  }
}

// ==================================================
// Custom Error
// ==================================================

export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

// Singleton
let _client: OpenAIClient | null = null;

export function getClient(): OpenAIClient {
  if (!_client) _client = new OpenAIClient();
  return _client;
}

export function initClient(config?: Partial<APIConfig>): OpenAIClient {
  _client = new OpenAIClient(config);
  return _client;
}
