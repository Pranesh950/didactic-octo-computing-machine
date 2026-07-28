import { useState } from "react";
import { Search } from "lucide-react";
import { startups } from "@/data/mock";
import CompanyCard from "@/components/shared/CompanyCard";

export default function Discover() {
  const [search, setSearch] = useState("");

  const filtered = startups.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase()) && !s.industry.toLowerCase().includes(search.toLowerCase()) && !s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-gray-800 bg-[#0b0c0e]">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startups by name, industry, or technology..."
            className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-md text-[13px] text-gray-0 focus:border-gray-600 focus:ring-2 focus:ring-accent-500/10 transition-all placeholder:text-gray-600 font-mono"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] text-gray-500 font-mono">{filtered.length} startup{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Search className="w-8 h-8 mb-3" />
            <p className="text-[13px] font-medium">No startups found</p>
            <p className="text-[11px] mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
