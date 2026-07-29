import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Eye, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge from "@/components/shared/Badge";
import CompanyLogo from "@/components/shared/CompanyLogo";
import type { Startup } from "@/data/mock";
import type { SortConfig, SortField } from "@/lib/discover-engine";
import { formatFunding } from "@/lib/discover-engine";

type ViewMode = "table" | "cards";

interface Props {
  data: Startup[];
  sort: SortConfig | null;
  onSort: (sort: SortConfig | null) => void;
  onSelectCompany: (company: Startup) => void;
}

// ── Column definitions ─────────────────────────────────

interface ColumnDef {
  key: SortField;
  label: string;
  width: string;
}

const columns: ColumnDef[] = [
  { key: "name", label: "Company", width: "min-w-[200px]" },
  { key: "industry", label: "Industry", width: "min-w-[140px]" },
  { key: "stage", label: "Stage", width: "min-w-[90px]" },
  { key: "totalFunding", label: "Funding", width: "min-w-[90px]" },
  { key: "founded", label: "Founded", width: "min-w-[80px]" },
  { key: "employeeCount", label: "Employees", width: "min-w-[80px]" },
  { key: "growthSignal", label: "Growth", width: "min-w-[80px]" },
];

const stageVariant: Record<string, "default" | "success" | "warning" | "info" | "neutral"> = {
  "Pre-seed": "info",
  "Seed": "success",
  "Series A": "warning",
  "Series B": "warning",
  "Series C+": "neutral",
};

const growthBadge: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
  high: { label: "High", variant: "success" },
  medium: { label: "Med", variant: "warning" },
  low: { label: "Low", variant: "neutral" },
};

// ── Table View ─────────────────────────────────────────

function TableView({ data, sort, onSort, onSelectCompany }: Props) {
  const handleSort = (field: SortField) => {
    if (sort?.field === field) {
      if (sort.dir === "asc") onSort({ field, dir: "desc" });
      else onSort(null);
    } else {
      onSort({ field, dir: "asc" });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort?.field !== field)
      return <ArrowUpDown className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-accent-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-accent-400" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800/60">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={cn(
                  "text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group hover:text-gray-300 transition-colors select-none",
                  col.width,
                )}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  <SortIcon field={col.key} />
                </div>
              </th>
            ))}
            <th className="w-12 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {data.map((company) => (
            <tr
              key={company.id}
              className="border-b border-gray-800/30 hover:bg-accent-500/3 transition-colors group/row"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <CompanyLogo name={company.name} size="sm" />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-200 group-hover/row:text-gray-0 transition-colors">
                      {company.name}
                    </p>
                    <p className="text-[11px] text-gray-600 truncate max-w-[180px]">{company.description}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] text-gray-400">{company.industry}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={stageVariant[company.stage] ?? "neutral"} size="sm">
                  {company.stage}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] text-gray-300 font-medium">{formatFunding(company.totalFunding)}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] text-gray-500">{company.founded}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] text-gray-400">{company.employeeCount}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    company.growthSignal === "high" && "text-emerald-400",
                    company.growthSignal === "medium" && "text-amber-400",
                    company.growthSignal === "low" && "text-gray-500",
                  )}
                >
                  {growthBadge[company.growthSignal]?.label ?? company.growthSignal}
                </span>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompany(company);
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                    title="Quick view"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Bookmark — coming soon
                    }}
                    className="p-1.5 rounded-md text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                    title="Bookmark"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Card View ──────────────────────────────────────────

function CardView({ data, onSelectCompany }: { data: Startup[]; onSelectCompany: (c: Startup) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
      {data.map((company) => (
        <div
          key={company.id}
          className="bg-gray-950/60 border border-gray-800/60 rounded-xl p-4 hover:border-accent-500/20 hover:bg-gray-950/80 transition-all duration-200 cursor-pointer group/card"
          onClick={() => onSelectCompany(company)}
        >
          <div className="flex items-start gap-3">
            <CompanyLogo name={company.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-[14px] font-semibold text-gray-200 group-hover/card:text-gray-0 transition-colors truncate">
                  {company.name}
                </h3>
                <Badge variant={stageVariant[company.stage] ?? "neutral"} size="sm">
                  {company.stage}
                </Badge>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2 mb-2.5">
                {company.description}
              </p>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-gray-400">{company.industry}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-400">{company.headquarters}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500">Founded {company.founded}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <span className="text-accent-400/80 font-medium">{formatFunding(company.totalFunding)}</span>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500">{company.employeeCount} employees</span>
                {company.growthSignal === "high" && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="text-emerald-400 font-medium">High growth</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Grid ──────────────────────────────────────────

export default function DiscoverGrid({ data, sort, onSort, onSelectCompany }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* View toggle bar */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-gray-800/40">
        <p className="text-[11px] text-gray-500 font-medium">
          {data.length} result{data.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center bg-gray-900/60 border border-gray-800 rounded-md p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all",
              viewMode === "table"
                ? "bg-gray-800 text-gray-200"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <List className="w-3 h-3" />
            Table
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all",
              viewMode === "cards"
                ? "bg-gray-800 text-gray-200"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <LayoutGrid className="w-3 h-3" />
            Cards
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "table" ? (
          <TableView data={data} sort={sort} onSort={onSort} onSelectCompany={onSelectCompany} />
        ) : (
          <CardView data={data} onSelectCompany={onSelectCompany} />
        )}
        {data.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <SearchIcon className="w-10 h-10 mb-4 text-gray-700" />
      <p className="text-[13px] font-medium">No results match your filters</p>
      <p className="text-[11px] mt-1 text-gray-600">Try adjusting or clearing some filters</p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8 11h6" />
    </svg>
  );
}
