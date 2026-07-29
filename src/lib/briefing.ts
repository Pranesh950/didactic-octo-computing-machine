/**
 * Briefing Agent Service.
 *
 * Generates professional VC investment memos for any company in the
 * StartupWiki database using the NVIDIA NIM API with automatic model
 * fallback (Llama 3.3 70B → Llama 3.1 8B).
 */
import type { ChatMessage } from "@/types/openai";
import { getClient } from "@/lib/api-client";
import type { Startup } from "@/types/startup";

export interface BriefingSection {
  heading: string;
  content: string;
}

export interface BriefingResult {
  /** Company this memo was generated for. */
  companyName: string;
  /** Parsed sections of the investment memo. */
  sections: BriefingSection[];
  /** Full raw markdown from the model. */
  rawMarkdown: string;
  /** Which model ended up being used. */
  modelUsed: string;
}

export type BriefingProgressCallback = (
  phase: "generating" | "streaming" | "complete",
  token?: string,
) => void;

function buildSystemPrompt(company: Startup): string {
  return `You are a Partner-level VC analyst at a top-tier venture capital firm. Your task is to write a professional investment memo about a startup.

Write in a crisp, analytical, and data-driven style. No fluff. No filler. Every sentence should carry weight.

COMPANY DATA:
- Name: ${company.name}
- Industry: ${company.industry} / ${company.subIndustry}
- Stage: ${company.stage}
- Founded: ${company.founded}, HQ: ${company.headquarters}
- Employees: ${company.employeeCount}
- Total Funding: $${(company.totalFunding / 1_000_000).toFixed(1)}M
- Last Funding: ${company.lastFundingDate}
- Description: ${company.longDescription}
- Founders:
${company.founders.map((f) => `  • ${f.name} (${f.role}): ${f.background}`).join("\n")}
- Funding Rounds:
${company.fundingRounds.map((r) => `  • ${r.round}: $${(r.amount / 1_000_000).toFixed(0)}M led by ${r.leadInvestor} (${r.date})`).join("\n")}
- Competitors: ${company.competitors.join(", ")}
- Technology: ${company.technology.join(", ")}
- Strengths: ${company.strengths.join("; ")}
- Risks: ${company.risks.join("; ")}

FORMAT your response as a professional investment memo with these EXACT sections:

## Executive Summary
[One crisp paragraph: what the company does, why it matters, key differentiator. 2-3 sentences.]

## Market Analysis
[Market size context, tailwinds, competitive positioning. 2-3 sentences.]

## Team Assessment
[Assessment of founder-market fit, relevant experience, gaps. 2-3 sentences.]

## Investment Thesis
[Why this company could be a venture-scale outcome. What needs to go right. 2-3 sentences.]

## Risk Analysis
[Key risks ranked by severity. What could go wrong. 2-3 sentences.]

## Recommendation
[One of: Strong Buy / Buy / Hold / Pass — with 1 sentence justification.]

Be professional, analytical, and direct. Use a VC partner's voice. No hedging, no consulting-speak, no "on the other hand."`;
}

function parseMemo(markdown: string): BriefingSection[] {
  const sectionHeadings = [
    "Executive Summary",
    "Market Analysis",
    "Team Assessment",
    "Investment Thesis",
    "Risk Analysis",
    "Recommendation",
  ];

  return sectionHeadings.map((heading) => {
    const regex = new RegExp(
      `## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`,
      "i",
    );
    const content = markdown.match(regex)?.[1]?.trim() || "";
    return { heading, content };
  });
}

export async function generateBriefing(
  company: Startup,
  onProgress?: BriefingProgressCallback,
): Promise<BriefingResult> {
  const client = getClient();
  const config = client.getConfig();
  const messages: ChatMessage[] = [
    { role: "system" as const, content: buildSystemPrompt(company) },
    {
      role: "user" as const,
      content: `Write an investment memo for ${company.name}.`,
    },
  ];

  onProgress?.("generating");

  let fullContent = "";
  let modelUsed = config.model;

  // 1. Try streaming with primary model
  try {
    for await (const token of client.chatStreamContent(messages, {
      model: config.model,
    })) {
      fullContent += token;
      onProgress?.("streaming", token);
    }
    modelUsed = config.model;
  } catch {
    // 2. Streaming failed — reset and try fallback model streaming
    fullContent = "";
    try {
      for await (const token of client.chatStreamContent(messages, {
        model: config.fallbackModel,
      })) {
        fullContent += token;
        onProgress?.("streaming", token);
      }
      modelUsed = config.fallbackModel;
    } catch {
      // 3. Both streaming failed — non-streaming fallback
      const { response, modelUsed: used } =
        await client.chatWithFallback(messages);
      const content = response.choices[0]?.message?.content;
      fullContent = typeof content === "string" ? content : "";
      modelUsed = used;
    }
  }

  onProgress?.("complete");

  const sections = parseMemo(fullContent);

  return {
    companyName: company.name,
    sections,
    rawMarkdown: fullContent,
    modelUsed,
  };
}
