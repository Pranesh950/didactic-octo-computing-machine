import { useState } from "react";
import {
  X,
  ExternalLink,
  TrendingUp,
  MapPin,
  Calendar,
  Users as UsersIcon,
  DollarSign,
  Cpu,
  AlertTriangle,
  User as UserIcon,
  BarChart3,
  Layers,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/shared/Badge";
import CompanyLogo from "@/components/shared/CompanyLogo";
import type { Startup } from "@/data/mock";
import { formatFunding } from "@/lib/discover-engine";

interface Props {
  company: Startup | null;
  onClose: () => void;
  onViewFull: (company: Startup) => void;
}

const stageVariant: Record<string, "default" | "success" | "warning" | "info" | "neutral"> = {
  "Pre-seed": "info",
  "Seed": "success",
  "Series A": "warning",
  "Series B": "warning",
  "Series C+": "neutral",
};

type TabId = "overview" | "leadership" | "funding" | "technology";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "leadership", label: "Leadership", icon: UserIcon },
  { id: "funding", label: "Funding", icon: BarChart3 },
  { id: "technology", label: "Technology", icon: Cpu },
];

export default function QuickViewDrawer({ company, onClose, onViewFull }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
          company ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        key={company?.id}
        className={cn(
          "fixed inset-y-0 right-0 w-[440px] bg-[#131316] border-l border-white/[0.04] z-50 flex flex-col shadow-[-24px_0_48px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          company ? "translate-x-0" : "translate-x-full",
        )}
      >
        {company && (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} size="md" />
                <div>
                  <h2 className="text-[15px] font-semibold text-white/90">{company.name}</h2>
                  <p className="text-[11px] text-white/40">{company.industry} · {company.subIndustry}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-lg hover:bg-[#131316]/[0.03] text-white/30 hover:text-accent-500 transition-all"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[#131316]/[0.03] text-white/30 hover:text-white/50 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-white/[0.04] px-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-all",
                      activeTab === tab.id
                        ? "border-accent-500 text-accent-400"
                        : "border-transparent text-white/40 hover:text-white/70",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* ── Overview Tab ── */}
              {activeTab === "overview" && (
                <>
                  <div className="p-5 border-b border-white/[0.04]">
                    <p className="text-[13px] text-white/50 leading-relaxed">{company.longDescription}</p>
                  </div>

                  <div className="p-5 border-b border-white/[0.04]">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Metric icon={DollarSign} label="Total Funding" value={formatFunding(company.totalFunding)} />
                      <Metric icon={Calendar} label="Founded" value={String(company.founded)} />
                      <Metric icon={UsersIcon} label="Employees" value={String(company.employeeCount)} />
                      <Metric icon={MapPin} label="HQ" value={company.headquarters} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={stageVariant[company.stage] ?? "neutral"} size="sm">{company.stage}</Badge>
                      {company.growthSignal === "high" && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          High growth
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-b border-white/[0.04]">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">AI Insight</h3>
                    <div className="bg-accent-500/10 border border-accent-500/20 rounded-lg p-3">
                      <p className="text-[12px] text-white/50 leading-relaxed">{company.aiInsight}</p>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      Risks
                    </h3>
                    <ul className="space-y-1.5">
                      {company.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-white/40">
                          <span className="text-red-400 mt-0.5">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* ── Leadership Tab ── */}
              {activeTab === "leadership" && (
                <div className="divide-y divide-white/[0.04]">
                  {company.founders.map((founder, i) => (
                    <div key={i} className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                          <span className="text-[12px] font-bold text-accent-400">
                            {founder.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-white/70">{founder.name}</p>
                          <p className="text-[11px] text-white/40">{founder.role}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-white/50 leading-relaxed mt-2">{founder.background}</p>
                      {founder.previousCompanies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {founder.previousCompanies.map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded-md bg-[#131316]/[0.03] border border-white/[0.04] text-[10px] text-white/40">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Funding Tab ── */}
              {activeTab === "funding" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Funding History</h3>
                    <span className="text-[12px] font-semibold text-white/70">{formatFunding(company.totalFunding)} total</span>
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#131316]/[0.04]" />
                    <div className="space-y-4">
                      {[...company.fundingRounds].reverse().map((round, i) => (
                        <div key={i} className="relative flex items-start gap-4 pl-10">
                          {/* Timeline node */}
                          <div className="absolute left-[8px] top-1.5 w-4 h-4 rounded-full border-2 border-accent-400 bg-[#131316]" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[13px] font-semibold text-white/70">
                                {formatFunding(round.amount)}
                              </span>
                              <Badge variant="info" size="sm">{round.round}</Badge>
                            </div>
                            <p className="text-[11px] text-white/40">
                              {new Date(round.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-[11px] text-white/40 mt-1">
                              Lead: <span className="text-white/70 font-medium">{round.leadInvestor}</span>
                            </p>
                            {round.investors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {round.investors.map((inv) => (
                                  <span key={inv} className="px-2 py-0.5 rounded-md bg-[#131316]/[0.03] border border-white/[0.04] text-[10px] text-white/40">
                                    {inv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Technology Tab ── */}
              {activeTab === "technology" && (
                <div className="divide-y divide-white/[0.04]">
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">Tech Stack</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.technology.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 rounded-md bg-[#131316]/[0.03] border border-white/[0.04] text-[10px] text-white/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">Competitors</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.competitors.map((comp) => (
                        <span
                          key={comp}
                          className="px-2 py-1 rounded-md bg-[#131316]/[0.03] border border-white/[0.04] text-[10px] text-white/40"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-md bg-accent-500/10 border border-accent-500/20 text-[10px] text-accent-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2.5">Strengths</h3>
                    <ul className="space-y-1.5">
                      {company.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.04]">
              <button
                onClick={() => onViewFull(company)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#131316]/[0.03] text-white text-[13px] font-semibold hover:bg-[#131316]/[0.04] transition-all"
              >
                View full profile
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-[#131316]/[0.02] border border-white/[0.04] rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-white/30 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-[14px] font-semibold text-white/70">{value}</p>
    </div>
  );
}
