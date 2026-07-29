import { Search, Save, Download, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoverMode } from "@/lib/discover-engine";

interface Props {
  mode: DiscoverMode;
  keyword: string;
  onModeChange: (mode: DiscoverMode) => void;
  onKeywordChange: (keyword: string) => void;
  resultCount: number;
}

export default function DiscoverHeader({
  mode,
  keyword,
  onModeChange,
  onKeywordChange,
  resultCount,
}: Props) {
  return (
    <div className="px-5 py-3 border-b border-gray-800/60 bg-[#0b0c0e]/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Mode toggle */}
        <div className="flex items-center bg-gray-900/60 border border-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => onModeChange("companies")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
              mode === "companies"
                ? "bg-accent-500/15 text-accent-400 shadow-sm"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Companies
          </button>
          <button
            onClick={() => onModeChange("people")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
              mode === "people"
                ? "bg-accent-500/15 text-accent-400 shadow-sm"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            <Users className="w-3.5 h-3.5" />
            People
          </button>
        </div>

        {/* Search bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder={
              mode === "companies"
                ? "Search by name, industry, technology, or tags…"
                : "Search by name, role, background, or company…"
            }
            className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-[13px] text-gray-0 focus:border-accent-500/40 focus:ring-2 focus:ring-accent-500/5 transition-all placeholder:text-gray-600"
          />
          {keyword && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-accent-400 font-medium">
              {resultCount} result{resultCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-600 transition-all font-medium cursor-not-allowed opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-600 transition-all font-medium cursor-not-allowed opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
