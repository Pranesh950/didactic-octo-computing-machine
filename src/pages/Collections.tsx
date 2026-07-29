import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  MoreHorizontal,
  ExternalLink,
  FolderOpen,
  Hash,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Lightbulb,
  Briefcase,
  Clock,
  Pin,
} from "lucide-react";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";
import { useStartups } from "@/hooks/useStartups";
import type { Collection, Startup } from "@/types/startup";
import {
  mergeCollections,
  loadUserCollections,
  saveUserCollections,
  createUserCollection,
} from "@/lib/collections";

type ViewMode = "table" | "board";
type SortField = "name" | "industry" | "stage" | "totalFunding" | "founded";
type SortDir = "asc" | "desc";

const typeConfig = {
  companies: { icon: Users, label: "Companies", color: "text-accent-400", bg: "bg-accent-500/10 border-accent-500/20" },
  founders: { icon: Users, label: "Founders", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  themes: { icon: Lightbulb, label: "Themes", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  deals: { icon: Briefcase, label: "Deals", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};

const stageVariant: Record<string, "default" | "success" | "warning" | "info" | "neutral"> = {
  "Pre-seed": "info",
  "Seed": "default",
  "Series A": "success",
  "Series B": "warning",
  "Series C+": "warning",
};



// ── Column definitions ──────────────────────────────────────
interface ColumnDef {
  key: SortField | "growthSignal";
  label: string;
  width: string;
  sortable: boolean;
}

const columns: ColumnDef[] = [
  { key: "name", label: "Name", width: "min-w-[220px]", sortable: true },
  { key: "industry", label: "Industry", width: "min-w-[160px]", sortable: true },
  { key: "stage", label: "Stage", width: "min-w-[100px]", sortable: true },
  { key: "totalFunding", label: "Funding", width: "min-w-[100px]", sortable: true },
  { key: "founded", label: "Founded", width: "min-w-[80px]", sortable: true },
  { key: "growthSignal", label: "Signal", width: "min-w-[80px]", sortable: false },
];

export default function Collections() {
  const { startups } = useStartups();
  const [selectedId, setSelectedId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [userColls, setUserColls] = useState<Collection[]>(() => loadUserCollections());

  // Persist user collections
  useEffect(() => {
    saveUserCollections(userColls);
  }, [userColls]);

  // Merge smart + user collections
  const collections = useMemo(
    () => mergeCollections(startups, userColls),
    [startups, userColls],
  );

  const selectedCollection = collections.find((c) => c.id === selectedId);
    const companies = useMemo(
    () => selectedCollection
      ? selectedCollection.items
          .map((id) => startups.find((s: any) => s.id === id))
          .filter((s): s is any => s !== undefined) as Startup[]
      : [],
    [selectedCollection, startups],
  );

  // Sort
  const sortedCompanies = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...companies].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [companies, sortField, sortDir]);

  // Filter
  const filteredCompanies = useMemo(
    () =>
      sortedCompanies.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [sortedCompanies, searchQuery],
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const selectedConfig = selectedCollection
    ? typeConfig[selectedCollection.type]
    : null;
  const SelectedIcon = selectedConfig?.icon ?? FolderOpen;

  return (
    <div className="flex h-full">
      {/* ── Left Sidebar: Collection list (Notion-style) ── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Pin className="w-4 h-4 text-accent-400" />
            <h2 className="text-[15px] font-semibold text-gray-0">Collections</h2>
          </div>
          <p className="text-[11px] text-gray-500 font-mono">
            {collections.length} collections
          </p>
        </div>

        {/* Collection list */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {collections.map((collection) => {
            const cfg = typeConfig[collection.type];
            const Icon = cfg.icon;
            const isSelected = collection.id === selectedId;

            return (
              <button
                key={collection.id}
                onClick={() => setSelectedId(collection.id)}
                className={cn(
                  "w-full text-left px-3 py-2 mx-1.5 rounded-md transition-all duration-75 group",
                  isSelected
                    ? "bg-gray-800 text-gray-0"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/70",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-accent-500/20" : "bg-gray-900 group-hover:bg-gray-800",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3 h-3",
                        isSelected ? cfg.color : "text-gray-500 group-hover:text-gray-400",
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate">
                      {collection.name}
                    </p>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                      {collection.itemCount} items
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* New Collection button (Notion-style bottom add) */}
        <div className="px-2.5 pb-2.5">
          <button
            onClick={() => {
              const newColl = createUserCollection("New Collection", "", "companies");
              setUserColls((prev) => [...prev, newColl]);
              setSelectedId(newColl.id);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-gray-500 hover:text-gray-300 hover:bg-gray-900 transition-colors font-mono group"
          >
            <Plus className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
            New collection
          </button>
        </div>
      </div>

      {/* ── Right: Content / Database view ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-1000">
        {/* Top bar: collection info + view switcher + search */}
        <div className="px-5 py-3.5 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {selectedCollection && selectedConfig && (
                <div
                  className={cn(
                    "w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0",
                    selectedConfig.bg,
                  )}
                >
                  <SelectedIcon className={cn("w-3.5 h-3.5", selectedConfig.color)} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-gray-0 truncate">
                  {selectedCollection?.name ?? "Select a collection"}
                </h3>
                {selectedCollection && (
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {selectedCollection.description}
                  </p>
                )}
              </div>
            </div>

            {/* View switcher + item count */}
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
              {selectedCollection && (
                <span className="text-[11px] text-gray-600 font-mono">
                  {filteredCompanies.length} of {companies.length} companies
                </span>
              )}
              <div className="flex items-center bg-gray-950 border border-gray-800 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5",
                    viewMode === "table"
                      ? "bg-gray-800 text-gray-200"
                      : "text-gray-500 hover:text-gray-400",
                  )}
                >
                  <List className="w-3 h-3" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5",
                    viewMode === "board"
                      ? "bg-gray-800 text-gray-200"
                      : "text-gray-500 hover:text-gray-400",
                  )}
                >
                  <LayoutGrid className="w-3 h-3" />
                  Board
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${selectedCollection?.itemCount ?? 0} companies...`}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-800 rounded-md text-[12px] text-gray-200 placeholder:text-gray-600 focus:border-gray-600 focus:ring-2 focus:ring-accent-500/10 transition-all font-mono"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {!selectedCollection ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <FolderOpen className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-400 mb-1">
                No collection selected
              </h3>
              <p className="text-[12px] text-gray-600 max-w-xs font-mono leading-relaxed">
                Choose a collection from the sidebar to view its saved companies
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* ── TABLE VIEW ── */
            <div className="min-w-full">
              {/* Table */}
              <table className="w-full">
                {/* Header */}
                <thead>
                  <tr className="border-b border-gray-800">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          "px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono select-none",
                          col.width,
                          col.sortable && "cursor-pointer hover:text-gray-300 transition-colors",
                        )}
                        onClick={() => col.sortable && handleSort(col.key as SortField)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.sortable && sortField === col.key && (
                            sortDir === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                        <p className="text-[12px] text-gray-600 font-mono">
                          {searchQuery
                            ? "No companies match your search"
                            : "This collection is empty — add companies from Discover"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-gray-800/50 hover:bg-gray-900/50 transition-colors group/row"
                      >
                        {/* Name */}
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/company/${company.id}`}
                            className="flex items-center gap-2.5 min-w-0"
                          >
                            <div className="w-6 h-6 rounded bg-accent-500/15 border border-accent-500/25 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] font-bold text-accent-400">
                                {company.logo}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-gray-200 truncate group-hover/row:text-accent-400 transition-colors">
                                {company.name}
                              </p>
                              <p className="text-[11px] text-gray-600 truncate font-mono">
                                {company.description}
                              </p>
                            </div>
                          </Link>
                        </td>

                        {/* Industry */}
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-gray-400 font-mono">
                            {company.industry}
                          </span>
                        </td>

                        {/* Stage */}
                        <td className="px-4 py-2.5">
                          <Badge variant={stageVariant[company.stage] ?? "neutral"}>
                            {company.stage}
                          </Badge>
                        </td>

                        {/* Funding */}
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-gray-300 font-mono tabular-nums">
                            ${(company.totalFunding / 1_000_000).toFixed(0)}M
                          </span>
                        </td>

                        {/* Founded */}
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-gray-500 font-mono tabular-nums">
                            {company.founded}
                          </span>
                        </td>

                        {/* Growth Signal */}
                        <td className="px-4 py-2.5">
                          {company.growthSignal === "high" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                              <TrendingUp className="w-3 h-3" />
                              High
                            </span>
                          ) : company.growthSignal === "medium" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                              <TrendingUp className="w-3 h-3" />
                              Med
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-600 font-mono">—</span>
                          )}
                        </td>

                        {/* Hover actions (Notion-style row reveal) */}
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <Link
                              to={`/company/${company.id}`}
                              className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-300 transition-colors"
                              title="Open company"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-300 transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Footer stats */}
              {filteredCompanies.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-800 flex items-center gap-4 text-[11px] text-gray-600 font-mono">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {filteredCompanies.length} companies
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Total: $
                    {filteredCompanies
                      .reduce((sum, c) => sum + c.totalFunding, 0) /
                      1_000_000
                    }
                    M
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    Updated {selectedCollection.lastUpdated}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ── BOARD VIEW ── */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCompanies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/company/${company.id}`}
                    className="block group/card"
                  >
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all card-hover">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-md bg-accent-500/15 border border-accent-500/25 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-accent-400">
                            {company.logo}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[13px] font-semibold text-gray-200 truncate group-hover/card:text-accent-400 transition-colors">
                            {company.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 font-mono">
                            {company.description}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <Badge variant={stageVariant[company.stage] ?? "neutral"}>
                          {company.stage}
                        </Badge>
                        <Badge variant="neutral">{company.industry}</Badge>
                      </div>

                      {/* Properties (Notion-style property list) */}
                      <div className="space-y-1.5 pt-3 border-t border-gray-800">
                        <Property label="Funding" icon={DollarSign}>
                          ${(company.totalFunding / 1_000_000).toFixed(0)}M
                        </Property>
                        <Property label="Founded" icon={Calendar}>
                          {company.founded}
                        </Property>
                        <Property label="Team" icon={Users}>
                          {company.employeeCount}
                        </Property>
                        {company.growthSignal === "high" && (
                          <Property label="Signal" icon={TrendingUp} accent>
                            High Growth
                          </Property>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[12px] text-gray-600 font-mono">
                    {searchQuery
                      ? "No companies match your search"
                      : "This collection is empty"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notion-style property row for board cards ──────────────
function Property({
  label,
  icon: Icon,
  children,
  accent,
}: {
  label: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        <Icon
          className={cn(
            "w-3 h-3",
            accent ? "text-emerald-400" : "text-gray-600",
          )}
        />
      </div>
      <span className="text-gray-600 font-mono w-14 flex-shrink-0">{label}</span>
      <span className={cn("font-mono", accent ? "text-emerald-400" : "text-gray-400")}>
        {children}
      </span>
    </div>
  );
}
