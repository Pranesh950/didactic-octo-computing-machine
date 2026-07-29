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
          "fixed inset-y-0 right-0 w-[440px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out",
          company ? "translate-x-0" : "translate-x-full",
        )}
      >
        {company && (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} size="md" />
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">{company.name}</h2>
                  <p className="text-[11px] text-gray-500">{company.industry} · {company.subIndustry}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-accent-500 transition-all"
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 px-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-all",
                      activeTab === tab.id
                        ? "border-accent-500 text-accent-600"
                        : "border-transparent text-gray-500 hover:text-gray-700",
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
                  <div className="p-5 border-b border-gray-100">
                    <p className="text-[13px] text-gray-600 leading-relaxed">{company.longDescription}</p>
                  </div>

                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Metric icon={DollarSign} label="Total Funding" value={formatFunding(company.totalFunding)} />
                      <Metric icon={Calendar} label="Founded" value={String(company.founded)} />
                      <Metric icon={UsersIcon} label="Employees" value={String(company.employeeCount)} />
                      <Metric icon={MapPin} label="HQ" value={company.headquarters} />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={stageVariant[company.stage] ?? "neutral"} size="sm">{company.stage}</Badge>
                      {company.growthSignal === "high" && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          High growth
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">AI Insight</h3>
                    <div className="bg-accent-50 border border-accent-100 rounded-lg p-3">
                      <p className="text-[12px] text-gray-600 leading-relaxed">{company.aiInsight}</p>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" />
                      Risks
                    </h3>
                    <ul className="space-y-1.5">
                      {company.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-gray-500">
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
                <div className="divide-y divide-gray-100">
                  {company.founders.map((founder, i) => (
                    <div key={i} className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center">
                          <span className="text-[12px] font-bold text-accent-600">
                            {founder.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">{founder.name}</p>
                          <p className="text-[11px] text-gray-500">{founder.role}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-gray-600 leading-relaxed mt-2">{founder.background}</p>
                      {founder.previousCompanies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {founder.previousCompanies.map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] text-gray-500">
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
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Funding History</h3>
                    <span className="text-[12px] font-semibold text-gray-700">{formatFunding(company.totalFunding)} total</span>
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
                    <div className="space-y-4">
                      {[...company.fundingRounds].reverse().map((round, i) => (
                        <div key={i} className="relative flex items-start gap-4 pl-10">
                          {/* Timeline node */}
                          <div className="absolute left-[8px] top-1.5 w-4 h-4 rounded-full border-2 border-accent-400 bg-white" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[13px] font-semibold text-gray-800">
                                {formatFunding(round.amount)}
                              </span>
                              <Badge variant="info" size="sm">{round.round}</Badge>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {new Date(round.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              Lead: <span className="text-gray-700 font-medium">{round.leadInvestor}</span>
                            </p>
                            {round.investors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {round.investors.map((inv) => (
                                  <span key={inv} className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] text-gray-500">
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
                <div className="divide-y divide-gray-100">
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Tech Stack</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.technology.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-[10px] text-gray-600"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Competitors</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.competitors.map((comp) => (
                        <span
                          key={comp}
                          className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-[10px] text-gray-500"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {company.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-md bg-accent-50 border border-accent-100 text-[10px] text-accent-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Strengths</h3>
                    <ul className="space-y-1.5">
                      {company.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
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
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => onViewFull(company)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-100 text-white text-[13px] font-semibold hover:bg-gray-200 transition-all"
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-[14px] font-semibold text-gray-800">{value}</p>
    </div>
  );
}
