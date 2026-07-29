import { useState, useEffect } from "react";
import { getCompanies, type Company } from "@/lib/backend-client";
import type { Startup } from "@/data/mock";

// ── Cache (module-level, survives re-renders) ────────────

let cached: Startup[] | null = null;
let fetchPromise: Promise<Startup[]> | null = null;

// ── Normalization ───────────────────────────────────────

/** Map Firestore document → Startup (camelCase + sensible defaults). */
function normalizeCompany(raw: Company): Startup {
  return {
    id: raw.id || "",
    name: raw.name || "Unknown",
    // Generate logo from name initials
    logo: (raw.name || "??")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    description: raw.description || "",
    longDescription: (raw.longDescription as string) || raw.description || "",
    industry: (raw.industry as string) || "Other",
    subIndustry: (raw.sub_industry as string) || (raw.subIndustry as string) || "",
    stage: (raw.stage as Startup["stage"]) || "Seed",
    founded: (raw.founded as number) || 0,
    headquarters: (raw.headquarters as string) || "",
    employeeCount: (raw.employees as number) || (raw.employeeCount as number) || 0,
    totalFunding: (raw.total_funding as number) || (raw.totalFunding as number) || 0,
    lastFundingDate: (raw.lastFundingDate as string) || (raw.last_funding_date as string) || "",
    founders: (Array.isArray(raw.founders) ? raw.founders : []).map((f: any) => ({
      name: f.name || "",
      role: f.role || "",
      background: f.background || "",
      previousCompanies: f.previousCompanies || f.previous_companies || [],
      linkedin: f.linkedin,
    })),
    fundingRounds: (Array.isArray(raw.fundingRounds || raw.funding_rounds) ? (raw.fundingRounds || raw.funding_rounds) as any[] : []).map((r: any) => ({
      round: r.round || "",
      amount: Number(r.amount) || 0,
      date: r.date || "",
      leadInvestor: r.leadInvestor || r.lead_investor || "",
      investors: r.investors || [],
    })),
    competitors: (raw.competitors as string[]) || [],
    technology: (raw.technology as string[]) || [],
    tags: (raw.tags as string[]) || [],
    growthSignal: (raw.growthSignal as Startup["growthSignal"]) || "medium",
    aiInsight: (raw.aiInsight as string) || (raw.ai_insight as string) || "",
    strengths: (raw.strengths as string[]) || [],
    risks: (raw.risks as string[]) || [],
  };
}

// ── Hook ────────────────────────────────────────────────

export function useStartups(): {
  startups: Startup[];
  loading: boolean;
  error: string | null;
} {
  const [startups, setStartups] = useState<Startup[]>(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) {
      setStartups(cached);
      setLoading(false);
      return;
    }

    if (fetchPromise) {
      fetchPromise.then((data) => {
        cached = data;
        setStartups(data);
        setLoading(false);
      });
      return;
    }

    fetchPromise = getCompanies().then((raw) => raw.map(normalizeCompany));

    fetchPromise
      .then((data) => {
        cached = data;
        setStartups(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load startups");
        setLoading(false);
      });
  }, []);

  return { startups, loading, error };
}
