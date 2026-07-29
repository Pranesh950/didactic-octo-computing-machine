import { useMemo } from "react";
import type { Startup } from "@/types/startup";

// ── Filter State ──────────────────────────────────────

export type DiscoverMode = "companies" | "people";

export interface FilterState {
  mode: DiscoverMode;
  keyword: string;
  industries: string[];
  stages: string[];
  growthSignals: string[];
  headquarters: string[];
  fundingMin: number | null;
  fundingMax: number | null;
  foundedMin: number | null;
  foundedMax: number | null;
  employeesMin: number | null;
  employeesMax: number | null;
}

export const INITIAL_FILTERS: FilterState = {
  mode: "companies",
  keyword: "",
  industries: [],
  stages: [],
  growthSignals: [],
  headquarters: [],
  fundingMin: null,
  fundingMax: null,
  foundedMin: null,
  foundedMax: null,
  employeesMin: null,
  employeesMax: null,
};

// ── Sort Config ───────────────────────────────────────

export type SortField = "name" | "industry" | "stage" | "totalFunding" | "founded" | "employeeCount" | "growthSignal";

export interface SortConfig {
  field: SortField;
  dir: "asc" | "desc";
}

// ── Filter Options (derived from data) ─────────────────

export interface FilterOptions {
  industries: string[];
  stages: string[];
  headquarters: string[];
  growthSignals: string[];
  fundingRange: { min: number; max: number };
  foundedRange: { min: number; max: number };
  employeesRange: { min: number; max: number };
}

export function extractFilterOptions(data: Startup[]): FilterOptions {
  const funding = data.map((d) => d.totalFunding);
  const founded = data.map((d) => d.founded);
  const employees = data.map((d) => d.employeeCount);

  return {
    industries: [...new Set(data.map((d) => d.industry))].sort(),
    stages: [...new Set(data.map((d) => d.stage))].sort(),
    headquarters: [...new Set(data.map((d) => d.headquarters))].sort(),
    growthSignals: [...new Set(data.map((d) => d.growthSignal))],
    fundingRange: { min: Math.min(...funding), max: Math.max(...funding) },
    foundedRange: { min: Math.min(...founded), max: Math.max(...founded) },
    employeesRange: { min: Math.min(...employees), max: Math.max(...employees) },
  };
}

// ── Active Filter Summary ──────────────────────────────

export interface ActiveFilter {
  id: string;
  category: string;
  label: string;
  onRemove: () => void;
}

export function getActiveFilters(filters: FilterState, onUpdate: (updates: Partial<FilterState>) => void): ActiveFilter[] {
  const result: ActiveFilter[] = [];

  if (filters.keyword) {
    result.push({
      id: "keyword",
      category: "Keyword",
      label: `"${filters.keyword}"`,
      onRemove: () => onUpdate({ keyword: "" }),
    });
  }

  filters.industries.forEach((v) =>
    result.push({
      id: `industry-${v}`,
      category: "Industry",
      label: v,
      onRemove: () => onUpdate({ industries: filters.industries.filter((x) => x !== v) }),
    }),
  );

  filters.stages.forEach((v) =>
    result.push({
      id: `stage-${v}`,
      category: "Stage",
      label: v,
      onRemove: () => onUpdate({ stages: filters.stages.filter((x) => x !== v) }),
    }),
  );

  filters.growthSignals.forEach((v) =>
    result.push({
      id: `growth-${v}`,
      category: "Growth",
      label: v,
      onRemove: () => onUpdate({ growthSignals: filters.growthSignals.filter((x) => x !== v) }),
    }),
  );

  filters.headquarters.forEach((v) =>
    result.push({
      id: `hq-${v}`,
      category: "Location",
      label: v,
      onRemove: () => onUpdate({ headquarters: filters.headquarters.filter((x) => x !== v) }),
    }),
  );

  if (filters.fundingMin !== null || filters.fundingMax !== null) {
    const min = filters.fundingMin ?? 0;
    const max = filters.fundingMax ?? Infinity;
    result.push({
      id: "funding",
      category: "Funding",
      label: `$${(min / 1_000_000).toFixed(0)}M – $${max === Infinity ? "∞" : `${(max / 1_000_000).toFixed(0)}M`}`,
      onRemove: () => onUpdate({ fundingMin: null, fundingMax: null }),
    });
  }

  return result;
}

// ── Hook ──────────────────────────────────────────────

function formatFunding(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  return `$${(amount / 1_000_000).toFixed(1)}M`;
}

const STAGE_ORDER: Record<string, number> = {
  "Pre-seed": 0,
  "Seed": 1,
  "Series A": 2,
  "Series B": 3,
  "Series C+": 4,
};

const GROWTH_ORDER: Record<string, number> = {
  "low": 0,
  "medium": 1,
  "high": 2,
};

export function useDiscoverEngine(data: Startup[], filters: FilterState, sort: SortConfig | null) {
  return useMemo(() => {
    // Filter
    let result = data.filter((item) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(kw) ||
          item.description.toLowerCase().includes(kw) ||
          item.industry.toLowerCase().includes(kw) ||
          item.subIndustry.toLowerCase().includes(kw) ||
          item.tags.some((t) => t.toLowerCase().includes(kw));
        if (!matches) return false;
      }

      if (filters.industries.length > 0 && !filters.industries.includes(item.industry)) return false;
      if (filters.stages.length > 0 && !filters.stages.includes(item.stage)) return false;
      if (filters.growthSignals.length > 0 && !filters.growthSignals.includes(item.growthSignal)) return false;
      if (filters.headquarters.length > 0 && !filters.headquarters.includes(item.headquarters)) return false;

      if (filters.fundingMin !== null && item.totalFunding < filters.fundingMin) return false;
      if (filters.fundingMax !== null && item.totalFunding > filters.fundingMax) return false;
      if (filters.foundedMin !== null && item.founded < filters.foundedMin) return false;
      if (filters.foundedMax !== null && item.founded > filters.foundedMax) return false;
      if (filters.employeesMin !== null && item.employeeCount < filters.employeesMin) return false;
      if (filters.employeesMax !== null && item.employeeCount > filters.employeesMax) return false;

      return true;
    });

    // Sort
    if (sort) {
      result = [...result].sort((a, b) => {
        let va: number | string;
        let vb: number | string;

        if (sort.field === "stage") {
          va = STAGE_ORDER[a.stage] ?? 99;
          vb = STAGE_ORDER[b.stage] ?? 99;
        } else if (sort.field === "growthSignal") {
          va = GROWTH_ORDER[a.growthSignal] ?? 0;
          vb = GROWTH_ORDER[b.growthSignal] ?? 0;
        } else {
          va = a[sort.field];
          vb = b[sort.field];
        }

        if (typeof va === "number" && typeof vb === "number") {
          return sort.dir === "asc" ? va - vb : vb - va;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
    }

    return result;
  }, [data, filters, sort]);
}

export { formatFunding, STAGE_ORDER, GROWTH_ORDER };
