import type { Collection, Startup } from "@/types/startup";

const COLLECTIONS_STORAGE_KEY = "startupwiki:collections";

// ── Smart Collections (generated from startup data) ──────

export function generateSmartCollections(startups: Startup[]): Collection[] {
  const collections: Collection[] = [];
  const now = new Date().toISOString().split("T")[0];

  // 1. By industry — top industries
  const industryCounts = new Map<string, number>();
  startups.forEach((s) => {
    industryCounts.set(s.industry, (industryCounts.get(s.industry) || 0) + 1);
  });
  const topIndustries = [...industryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topIndustries.forEach(([industry, count]) => {
    const items = startups.filter((s) => s.industry === industry).map((s) => s.id);
    collections.push({
      id: `industry-${industry.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: `${industry}`,
      description: `All ${industry} companies`,
      type: "themes",
      itemCount: count,
      lastUpdated: now,
      items,
    });
  });

  // 2. By stage
  const stageOrder = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];
  stageOrder.forEach((stage) => {
    const items = startups.filter((s) => s.stage === stage).map((s) => s.id);
    if (items.length === 0) return;
    collections.push({
      id: `stage-${stage.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: `${stage} Companies`,
      description: `Startups at ${stage} stage`,
      type: "deals",
      itemCount: items.length,
      lastUpdated: now,
      items,
    });
  });

  // 3. High growth
  const highGrowth = startups.filter((s) => s.growthSignal === "high");
  if (highGrowth.length > 0) {
    collections.push({
      id: "high-growth",
      name: "High Growth",
      description: "Companies showing strong growth signals",
      type: "companies",
      itemCount: highGrowth.length,
      lastUpdated: now,
      items: highGrowth.map((s) => s.id),
    });
  }

  // 4. Most funded (top 5 by funding)
  const mostFunded = [...startups]
    .sort((a, b) => b.totalFunding - a.totalFunding)
    .slice(0, 10);
  collections.push({
    id: "most-funded",
    name: "Most Funded",
    description: "Top companies by total funding raised",
    type: "companies",
    itemCount: mostFunded.length,
    lastUpdated: now,
    items: mostFunded.map((s) => s.id),
  });

  // 5. Recently funded
  const withFunding = startups.filter((s) => s.lastFundingDate);
  const recentFunding = [...withFunding]
    .sort((a, b) => new Date(b.lastFundingDate).getTime() - new Date(a.lastFundingDate).getTime())
    .slice(0, 15);
  if (recentFunding.length > 0) {
    collections.push({
      id: "recently-funded",
      name: "Recently Funded",
      description: "Companies with the most recent funding rounds",
      type: "deals",
      itemCount: recentFunding.length,
      lastUpdated: now,
      items: recentFunding.map((s) => s.id),
    });
  }

  return collections;
}

// ── User Collections (persisted to localStorage) ─────────

export function loadUserCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserCollections(collections: Collection[]): void {
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  } catch {
    /* quota exceeded */
  }
}

export function createUserCollection(
  name: string,
  description: string,
  type: Collection["type"],
  items: string[] = [],
): Collection {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    type,
    itemCount: items.length,
    lastUpdated: new Date().toISOString().split("T")[0],
    items,
  };
}

// ── Combined Hook-friendly merge ─────────────────────────

export function mergeCollections(
  startups: Startup[],
  userCollections: Collection[],
): Collection[] {
  const smart = generateSmartCollections(startups);
  return [...smart, ...userCollections];
}
