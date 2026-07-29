/**
 * Scout Agent Service.
 *
 * Builds system prompts with StartupWiki database context and
 * processes research results via the NVIDIA NIM API with automatic
 * model fallback (Llama 3.3 70B → Llama 3.1 8B).
 */
import type { ChatMessage } from "@/types/openai";
import { getClient } from "@/lib/api-client";
import { getCompanies } from "@/lib/backend-client";

export interface ScoutResult {
  topCompanies: Array<{ name: string; stage: string; insight: string }>;
  marketOverview: string;
  investmentThesis: string;
  risks: string;
  rawMarkdown: string;
  /** Which model ended up being used for this query. */
  modelUsed: string;
}

export type ScoutProgressCallback = (step: string, token?: string) => void;

function buildSystemPrompt(startups: Array<{ id: string; name: string; stage?: string; industry?: string; description?: string; founded?: number; headquarters?: string; hq?: string; total_funding?: number; totalFunding?: number; founders?: Array<{ name: string }> }>) {
  const companyLines = startups
    .filter(s => s.name && s.description)
    .slice(0, 20)
    .map((s) => {
      const funding = s.total_funding || s.totalFunding || 0;
      const founders = (s.founders || []).map(f => f.name).join(", ") || "N/A";
      return `- ${s.name} (${s.stage || 'N/A'}, ${s.industry || 'N/A'}): ${s.description}. Founded ${s.founded || 'N/A'}, HQ ${s.headquarters || s.hq || 'N/A'}. Total funding: $${(funding / 1_000_000).toFixed(0)}M. Founders: ${founders}.`;
    })
    .join("\n");

  return `You are Scout, an AI research agent at StartupWiki Terminal — a startup intelligence platform for venture capital investors.

You have access to a database of startups. When asked to research, you analyze the available data and produce a structured report.

AVAILABLE STARTUPS IN DATABASE:
${companyLines}

INSTRUCTIONS:
1. Analyze the user's research question against the database
2. Identify the most relevant companies
3. Provide a market overview and investment thesis
4. Format your response as a structured report in Markdown with these sections:

## Top Companies
[List 3-5 most relevant companies with why they matter. Format each as: "- Company Name: insight about why they matter"]

## Market Overview
[2-3 sentences on the state of this market]

## Investment Thesis
[Why this space is attractive for venture investment]

## Risks
[Key risks and concerns to watch]

Be concise, data-driven, and actionable. Use a professional VC tone.`;
}

export async function runScoutResearch(
  query: string,
  onProgress?: ScoutProgressCallback,
): Promise<ScoutResult> {
  const client = getClient();
  const config = client.getConfig();

  const startups = await getCompanies();
  const SYSTEM_PROMPT = buildSystemPrompt(startups);
  onProgress?.("searching", undefined);

  const messages: ChatMessage[] = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: query },
  ];

  let fullContent = "";
  let modelUsed = config.model;

  // 1. Try streaming with primary model
  try {
    let tokenCount = 0;
    for await (const token of client.chatStreamContent(messages, { model: config.model })) {
      fullContent += token;
      tokenCount++;
      if (tokenCount === 5) onProgress?.("founders", undefined);
      if (tokenCount === 30) onProgress?.("funding", undefined);
      if (tokenCount === 60) onProgress?.("competitors", undefined);
      if (tokenCount === 90) onProgress?.("report", undefined);
      onProgress?.("streaming", token);
    }
    modelUsed = config.model; // primary streaming succeeded
  } catch {
    // 2. Streaming failed — reset and try streaming with fallback model
    fullContent = "";
    try {
      let tokenCount = 0;
      for await (const token of client.chatStreamContent(messages, { model: config.fallbackModel })) {
        fullContent += token;
        tokenCount++;
        if (tokenCount === 5) onProgress?.("founders", undefined);
        if (tokenCount === 30) onProgress?.("funding", undefined);
        if (tokenCount === 60) onProgress?.("competitors", undefined);
        if (tokenCount === 90) onProgress?.("report", undefined);
        onProgress?.("streaming", token);
      }
      modelUsed = config.fallbackModel; // fallback streaming succeeded
    } catch {
      // 3. Both streaming attempts failed — non-streaming with fallback
      const { response, modelUsed: used } = await client.chatWithFallback(messages);
      const content = response.choices[0]?.message?.content;
      fullContent = typeof content === "string" ? content : "";
      modelUsed = used;
    }
  }

  onProgress?.("complete", undefined);

  const parsed = parseScoutOutput(fullContent);
  return { ...parsed, modelUsed };
}

function parseScoutOutput(markdown: string): Omit<ScoutResult, "modelUsed"> {
  const section = (heading: string): string => {
    const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=## |$)`, "i");
    return markdown.match(regex)?.[1]?.trim() || "";
  };

  const companySection = section("Top Companies");
  const companies = companySection
    .split("\n")
    .filter((line) => line.trim().startsWith("-") || /^\d+\./.test(line.trim()))
    .slice(0, 5)
    .map((line) => {
      const clean = line.replace(/^[-*\d.]+\s*\*?\*?/, "").trim();
      const colonIdx = clean.indexOf(":");
      if (colonIdx === -1) {
        return { name: clean, stage: "—", insight: "" };
      }
      return {
        name: clean.slice(0, colonIdx).trim(),
        stage: "—",
        insight: clean.slice(colonIdx + 1).trim(),
      };
    });

  return {
    topCompanies: companies,
    marketOverview: section("Market Overview"),
    investmentThesis: section("Investment Thesis"),
    risks: section("Risks"),
    rawMarkdown: markdown,
  };
}
