/**
 * Scout Agent Service.
 *
 * Builds system prompts with StartupWiki database context and
 * processes research results via the NVIDIA NIM API with automatic
 * model fallback (Llama 3.3 70B → Llama 3.1 8B).
 */
import type { ChatMessage } from "@/types/openai";
import { getClient } from "@/lib/api-client";
import { startups } from "@/data/mock";

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

const SYSTEM_PROMPT = `You are Scout, an AI research agent at StartupWiki Terminal — a startup intelligence platform for venture capital investors.

You have access to a database of startups. When asked to research, you analyze the available data and produce a structured report.

AVAILABLE STARTUPS IN DATABASE:
${startups
  .map(
    (s) =>
      `- ${s.name} (${s.stage}, ${s.industry}): ${s.description}. Founded ${s.founded}, HQ ${s.headquarters}. Total funding: $${(s.totalFunding / 1_000_000).toFixed(0)}M. Founders: ${s.founders.map((f) => f.name).join(", ")}.`,
  )
  .join("\n")}

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

export async function runScoutResearch(
  query: string,
  onProgress?: ScoutProgressCallback,
): Promise<ScoutResult> {
  const client = getClient();
  const config = client.getConfig();
  const messages: ChatMessage[] = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: query },
  ];

  onProgress?.("searching", undefined);

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
