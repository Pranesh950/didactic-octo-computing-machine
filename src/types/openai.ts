/**
 * OpenAI-compatible API types.
 *
 * Follows the standard OpenAI chat completions API specification.
 * Compatible with any OpenAI-compatible endpoint:
 * - NVIDIA NIM (integrate.api.nvidia.com)
 * - OpenAI (api.openai.com)
 * - Ollama (localhost)
 * - Any vLLM / LocalAI / LiteLLM instance
 */

// ==================================================
// Message Types
// ==================================================

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: MessageRole;
  content: string | ChatContentPart[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "auto" | "low" | "high" };
}

// ==================================================
// Tool / Function Calling
// ==================================================

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// ==================================================
// Request
// ==================================================

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  max_completion_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: ToolDefinition[];
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, unknown>;
  };
  seed?: number;
  parallel_tool_calls?: boolean;
}

// ==================================================
// Response (non-streaming)
// ==================================================

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: TokenUsage;
  system_fingerprint?: string;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call" | null;
  logprobs?: unknown | null;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ==================================================
// Streaming Response (SSE chunks)
// ==================================================

export interface ChatCompletionStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: StreamChoice[];
  usage?: TokenUsage;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
  logprobs?: unknown | null;
}

export interface StreamDelta {
  role?: MessageRole;
  content?: string;
  tool_calls?: Partial<ToolCall>[];
}

// ==================================================
// Error Response
// ==================================================

export interface APIError {
  error: {
    message: string;
    type: string;
    param?: string | null;
    code?: string | null;
  };
}

// ==================================================
// API Configuration with Fallback Support
// ==================================================

export interface APIConfig {
  baseURL: string;
  apiKey: string;
  /** Primary model — the best available. */
  model: string;
  /** Fallback model — tried if primary fails. Smaller, faster, still capable. */
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
}

/**
 * NVIDIA NIM defaults — free tier with powerful models.
 *
 * Primary:   meta/llama-3.3-70b-instruct   (70B, best reasoning)
 * Fallback:  meta/llama-3.1-8b-instruct    (8B, fast, reliable)
 *
 * Override via VITE_API_BASE_URL / VITE_API_KEY / VITE_API_MODEL env vars.
 */
export function getDefaultAPIConfig(): APIConfig {
  return {
    baseURL:
      import.meta.env.VITE_API_BASE_URL ||
      "https://integrate.api.nvidia.com/v1",
    apiKey:
      import.meta.env.VITE_API_KEY ||
      "",
    model:
      import.meta.env.VITE_API_MODEL ||
      "meta/llama-3.3-70b-instruct",
    fallbackModel:
      import.meta.env.VITE_API_FALLBACK_MODEL ||
      "meta/llama-3.1-8b-instruct",
    maxTokens: Number(import.meta.env.VITE_API_MAX_TOKENS) || 4096,
    temperature: Number(import.meta.env.VITE_API_TEMPERATURE) || 0.0,
  };
}
