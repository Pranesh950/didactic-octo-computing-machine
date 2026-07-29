import { memo } from "react";
import { Link } from "react-router-dom";
import Badge from "@/components/shared/Badge";
import { formatCurrency } from "@/lib/utils";
import type { Startup } from "@/types/startup";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

const stageVariant: Record<string, "default" | "success" | "warning" | "info" | "neutral"> = {
  "Pre-seed": "info",
  "Seed": "default",
  "Series A": "success",
  "Series B": "warning",
  "Series C+": "warning",
};

const CompanyCard = memo(function CompanyCard({ company }: { company: Startup }) {
  return (
    <Link to={`/company/${company.id}`} className="block group">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 card-hover">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-300 font-semibold text-xs font-mono">{company.logo}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-0 text-[13px] truncate group-hover:text-accent-400 transition-colors">
              {company.name}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
              {company.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant={stageVariant[company.stage] ?? "neutral"}>{company.stage}</Badge>
          <Badge variant="neutral">{company.industry}</Badge>
          {company.growthSignal === "high" && (
            <span className="inline-flex items-center border font-medium px-2 py-px text-[10px] rounded bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono">
              <TrendingUp className="w-2.5 h-2.5 mr-1" />
              High Growth
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gray-500 border-t border-gray-800 pt-3 font-mono">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCurrency(company.totalFunding)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {company.employeeCount}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {company.founded}
          </span>
        </div>
      </div>    </Link>
  );
});

export default CompanyCard;

