// @ts-nocheck
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, DollarSign, Users, Calendar, TrendingUp, Shield, AlertTriangle, Building2 } from "lucide-react";
import { useStartups } from "@/hooks/useStartups";
import Badge from "@/components/shared/Badge";
import { formatCurrency, cn } from "@/lib/utils";

type Tab = "overview" | "founders" | "funding" | "competitors" | "analysis";
const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "founders", label: "Founders" },
  { key: "funding", label: "Funding" },
  { key: "competitors", label: "Competitors" },
  { key: "analysis", label: "AI Analysis" },
];

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const { startups, loading } = useStartups();
  const company = startups.find((s) => s.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500 font-mono">Company not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Link to="/discover" className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors font-mono">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-300 font-bold text-base font-mono">{company.logo}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-0">{company.name}</h1>
            <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">{company.longDescription}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge>{company.stage}</Badge>
              <Badge variant="neutral">{company.industry}</Badge>
              <Badge variant="info">{company.subIndustry}</Badge>
              {company.growthSignal === "high" && <Badge variant="success">High Growth</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-500 font-mono">
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(company.totalFunding)}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{company.employeeCount}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{company.founded}</span>
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{company.headquarters}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px",
              tab === t.key ? "border-accent-500 text-accent-300" : "border-transparent text-gray-500 hover:text-gray-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === "overview" && <OverviewTab company={company} />}
        {tab === "founders" && <FoundersTab company={company} />}
        {tab === "funding" && <FundingTab company={company} />}
        {tab === "competitors" && <CompetitorsTab company={company} />}
        {tab === "analysis" && <AnalysisTab company={company} />}
      </div>
    </div>
  );
}

function OverviewTab({ company }: { company: NonNullable<ReturnType<typeof useStartups>["startups"]>[0] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-gray-200 mb-3">Company Description</h3>
          <p className="text-[13px] text-gray-400 leading-relaxed">{company.longDescription}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-gray-200 mb-3">Technology Stack</h3>
          <div className="flex flex-wrap gap-1.5">
            {company.technology.map((tech) => (
              <Badge key={tech} variant="info">{tech}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h3 className="text-[13px] font-semibold text-gray-200 mb-3">Key Facts</h3>
          <dl className="space-y-3 text-[13px]">
            {[
              ["Industry", company.industry],
              ["Sub-Industry", company.subIndustry],
              ["Stage", company.stage],
              ["Founded", String(company.founded)],
              ["HQ", company.headquarters],
              ["Employees", String(company.employeeCount)],
              ["Total Funding", formatCurrency(company.totalFunding)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="text-gray-200 font-medium text-right font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

function FoundersTab({ company }: { company: any }) {
  return (
    <div className="space-y-4">
      {company.founders.map((founder) => (
        <div key={founder.name} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-300 font-semibold text-xs font-mono">
                {founder.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-0 text-[13px]">{founder.name}</h3>
              <p className="text-[12px] text-accent-400 font-mono">{founder.role}</p>
              <p className="text-[13px] text-gray-400 mt-2 leading-relaxed">{founder.background}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {founder.previousCompanies.map((c) => (
                  <Badge key={c} variant="neutral">{c}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FundingTab({ company }: { company: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-[13px] font-semibold text-gray-200 mb-4">Funding Rounds</h3>
        <div className="space-y-2">
          {company.fundingRounds.map((round, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-gray-950 rounded-lg border border-gray-800">
              <div className="w-20 flex-shrink-0">
                <span className="text-[11px] text-gray-500 font-mono">{round.date}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">{round.round}</Badge>
                  <span className="text-[13px] font-bold text-gray-100 font-mono">{formatCurrency(round.amount)}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Lead: {round.leadInvestor} · {round.investors.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h3 className="text-[13px] font-semibold text-gray-200 mb-2">Funding Summary</h3>
        <p className="text-xl font-bold text-gray-0 font-mono">{formatCurrency(company.totalFunding)}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Total across {company.fundingRounds.length} rounds</p>
      </div>
    </div>
  );
}

function CompetitorsTab({ company }: { company: any }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h3 className="text-[13px] font-semibold text-gray-200 mb-4">Competitor Landscape</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {company.competitors.map((comp) => (
          <div key={comp} className="p-4 bg-gray-950 rounded-lg border border-gray-800 text-center">
            <div className="w-9 h-9 rounded-md bg-gray-800 mx-auto flex items-center justify-center mb-2">
              <span className="text-gray-400 font-semibold text-[10px] font-mono">{comp.slice(0, 2).toUpperCase()}</span>
            </div>
            <p className="text-[13px] font-medium text-gray-300">{comp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisTab({ company }: { company: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent-400" />
          <h3 className="text-[13px] font-semibold text-gray-200">AI Analysis</h3>
        </div>
        <p className="text-[13px] text-gray-400 leading-relaxed">{company.aiInsight}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-gray-200">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {company.strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-gray-400 flex gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-[13px] font-semibold text-gray-200">Risks</h3>
          </div>
          <ul className="space-y-2">
            {company.risks.map((r, i) => (
              <li key={i} className="text-[13px] text-gray-400 flex gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
