export interface Founder {
  name: string;
  role: string;
  background: string;
  linkedin?: string;
  previousCompanies: string[];
}

export interface FundingRound {
  round: string;
  amount: number;
  date: string;
  leadInvestor: string;
  investors: string[];
}

export interface Startup {
  id: string;
  name: string;
  logo: string;
  description: string;
  longDescription: string;
  industry: string;
  subIndustry: string;
  stage: "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C+";
  founded: number;
  headquarters: string;
  employeeCount: number;
  totalFunding: number;
  lastFundingDate: string;
  founders: Founder[];
  fundingRounds: FundingRound[];
  competitors: string[];
  technology: string[];
  tags: string[];
  growthSignal: "high" | "medium" | "low";
  aiInsight: string;
  strengths: string[];
  risks: string[];
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Completed" | "Paused";
  companiesTracked: number;
  reports: number;
  lastUpdated: string;
  companies: string[];
  trends: string[];
  overview: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: "companies" | "founders" | "themes" | "deals";
  itemCount: number;
  lastUpdated: string;
  items: string[];
}

export interface MarketIntel {
  id: string;
  type: "new_startups" | "funding_round" | "trend" | "founder_move";
  title: string;
  subtitle: string;
  metric?: string;
  change?: string;
  timeLabel: string;
}
