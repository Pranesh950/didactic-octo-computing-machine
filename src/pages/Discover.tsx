import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, LayoutGrid, List } from "lucide-react";
import { startups } from "@/data/mock";
import CompanyCard from "@/components/shared/CompanyCard";
import Badge from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

const industries = ["All", "AI & Machine Learning", "Robotics", "Biotech", "Climate Tech", "Fintech"];
const stages = ["All", "Pre-seed", "Seed", "Series A", "Series B", "Series C+"];

export default function Discover() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All");
  const [stage, setStage] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = startups.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (industry !== "All" && s.industry !== industry) return false;
    if (stage !== "All" && s.stage !== stage) return false;
    return true;
  });

  return (
    <div className="flex h-full">
      {/* Filter sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-gray-800 bg-[#0b0c0e] p-4 space-y-6 overflow-y-auto">
        <div>
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 font-mono">Industry</h3>
          <div className="space-y-px">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded text-[12px] transition-colors",
                  industry === ind ? "bg-accent-500/10 text-accent-300 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/50",
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 font-mono">Stage</h3>
          <div className="space-y-px">
            {stages.map((st) => (
              <button
                key={st}
                onClick={() => setStage(st)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded text-[12px] transition-colors",
                  stage === st ? "bg-accent-500/10 text-accent-300 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/50",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-gray-800">
          <p className="text-[10px] text-gray-600 font-mono">
            {filtered.length} results
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-5 py-3 border-b border-gray-800 bg-[#0b0c0e] flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search startups, founders, investors..."
              className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-md text-[13px] text-gray-0 focus:border-gray-600 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-gray-600"
            />
          </div>
          <div className="flex items-center gap-0.5 border border-gray-800 rounded-md p-0.5 bg-gray-950">
            <button onClick={() => setView("grid")} className={cn("p-1.5 rounded", view === "grid" ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:text-gray-300")}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded", view === "list" ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:text-gray-300")}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Search className="w-8 h-8 mb-3" />
              <p className="text-[13px] font-medium">No companies found</p>
              <p className="text-[11px] mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyRow({ company }: { company: (typeof startups)[0] }) {
  return (
    <Link
      to={`/company/${company.id}`}
      className="flex items-center gap-4 p-3.5 bg-gray-900 border border-gray-800 rounded-lg card-hover group"
    >
      <div className="w-9 h-9 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-accent-300 font-semibold text-xs font-mono">{company.logo}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-0 text-[13px] group-hover:text-accent-400 transition-colors">{company.name}</h3>
        <p className="text-[11px] text-gray-500 truncate">{company.description}</p>
      </div>
      <Badge variant="neutral">{company.industry}</Badge>
      <Badge>{company.stage}</Badge>
      <span className="text-[11px] text-gray-500 font-mono w-20 text-right">{company.headquarters}</span>
    </Link>
  );
}
