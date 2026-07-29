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

export default function QuickViewDrawer({ company, onClose, onViewFull }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
          company ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-[420px] bg-[#0b0c0e] border-l border-gray-800/60 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out",
          company ? "translate-x-0" : "translate-x-full",
        )}
      >
        {company && (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CompanyLogo name={company.name} size="md" />
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-200">{company.name}</h2>
                  <p className="text-[11px] text-gray-500">{company.industry} · {company.subIndustry}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-800/70 text-gray-500 hover:text-gray-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Description */}
              <div className="p-5 border-b border-gray-800/40">
                <p className="text-[13px] text-gray-400 leading-relaxed">{company.longDescription}</p>
              </div>

              {/* Key metrics */}
              <div className="p-5 border-b border-gray-800/40">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Metrics</h3>
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

              {/* Founders */}
              <div className="p-5 border-b border-gray-800/40">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Founders</h3>
                <div className="space-y-3">
                  {company.founders.map((founder, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-medium text-gray-300">{founder.name}</span>
                        <span className="text-[11px] text-gray-500">· {founder.role}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">{founder.background}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="p-5 border-b border-gray-800/40">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  Technology
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {company.technology.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded-md bg-gray-900 border border-gray-800 text-[10px] text-gray-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Competitors */}
              <div className="p-5 border-b border-gray-800/40">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Competitors</h3>
                <div className="flex flex-wrap gap-1.5">
                  {company.competitors.map((comp) => (
                    <span
                      key={comp}
                      className="px-2 py-1 rounded-md bg-gray-900 border border-gray-800 text-[10px] text-gray-500"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Insight */}
              <div className="p-5 border-b border-gray-800/40">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">AI Insight</h3>
                <div className="bg-accent-500/5 border border-accent-500/10 rounded-lg p-3">
                  <p className="text-[12px] text-gray-400 leading-relaxed">{company.aiInsight}</p>
                </div>
              </div>

              {/* Risks */}
              <div className="p-5">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Risks
                </h3>
                <ul className="space-y-1.5">
                  {company.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-gray-500">
                      <span className="text-red-400/60 mt-0.5">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800/60">
              <button
                onClick={() => onViewFull(company)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-gray-900 text-[13px] font-semibold hover:bg-gray-100 transition-all"
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
    <div className="bg-gray-950/70 border border-gray-800/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-[14px] font-semibold text-gray-200">{value}</p>
    </div>
  );
}
