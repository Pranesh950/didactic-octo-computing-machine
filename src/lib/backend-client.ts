/**
 * StartupWiki Terminal — Backend API Client.
 *
 * Communicates with the FastAPI/LangGraph backend at localhost:8000.
 * The backend orchestrates hierarchical AI agents (Manager → Research | Briefing)
 * via LangGraph, using NVIDIA NIM as the underlying LLM.
 *
 * All the complexity — prompt engineering, tool calling, agent routing,
 * model fallback — lives server-side. The frontend just sends queries
 * and displays results.
 */

export interface AgentResponse {
  response: string;
  intent: string | null;
  model_used: string;
  sub_agents: string[];
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  sub_industry: string;
  stage: string;
  founded: number;
  headquarters: string;
  employees: number;
  total_funding: number;
  [key: string]: unknown;
}

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://didactic-octo-computing-machine-production.up.railway.app";

export class BackendError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch {
      // ignore
    }
    throw new BackendError(response.status, detail);
  }

  return response.json();
}

/**
 * Run the full LangGraph agent graph on a user query.
 *
 * The backend:
 * 1. Manager Router classifies intent (research | briefing | general)
 * 2. Dispatches to Research Agent or Briefing Agent
 * 3. Manager Synthesizer combines results into final response
 *
 * @param query - Natural language query
 * @param companyId - Company ID when viewing a specific company (for briefing)
 */
export async function runAgent(
  query: string,
  companyId?: string,
): Promise<AgentResponse> {
  return request<AgentResponse>("/api/agent", {
    method: "POST",
    body: JSON.stringify({ query, company_id: companyId }),
  });
}

/**
 * Run the agent and receive results via SSE streaming.
 *
 * Calls onToken for each text chunk, onComplete when finished.
 */
export async function runAgentStream(
  query: string,
  companyId: string | undefined,
  callbacks: {
    onToken?: (token: string) => void;
    onComplete?: (response: AgentResponse) => void;
    onError?: (error: string) => void;
  },
): Promise<AgentResponse> {
  const url = `${BACKEND_URL}/api/agent/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, company_id: companyId }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.text();
      detail = body.slice(0, 200);
    } catch { /* ignore */ }
    throw new BackendError(
      response.status,
      `Stream request failed (${response.status}) — ${url}. ${detail}`.trim(),
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new BackendError(500, "No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedContent = "";
  let finalResponse: AgentResponse = {
    response: "",
    intent: null,
    model_used: "",
    sub_agents: [],
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const event = JSON.parse(data);

          switch (event.type) {
            case "token":
              accumulatedContent += event.content;
              callbacks.onToken?.(event.content);
              break;
            case "complete":
              finalResponse = {
                response: accumulatedContent,
                intent: finalResponse.intent || event.intent || null,
                model_used: event.model_used || finalResponse.model_used,
                sub_agents: finalResponse.sub_agents,
              };
              callbacks.onComplete?.(finalResponse);
              break;
            case "intent_detected":
              finalResponse.intent = event.intent;
              break;
            case "error":
              callbacks.onError?.(event.message);
              break;
          }
        } catch {
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // If onComplete was never called (no "complete" SSE event), build response from tokens
  if (accumulatedContent && !finalResponse.response) {
    finalResponse.response = accumulatedContent;
  }

  return finalResponse;
}

/**
 * Get all companies from the backend database.
 */
export async function getCompanies(): Promise<Company[]> {
  const result = await request<{ companies: Company[] }>("/api/companies");
  return result.companies;
}

/**
 * Check if the backend is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
