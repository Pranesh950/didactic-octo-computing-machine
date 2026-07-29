import { X } from "lucide-react";
import type { ActiveFilter } from "@/lib/discover-engine";

interface Props {
  filters: ActiveFilter[];
}

export default function ActiveFilters({ filters }: Props) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-5 pt-3 pb-1">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-1">
        Filters
      </span>
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={f.onRemove}
          className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-[11px] text-accent-300 hover:bg-accent-500/15 hover:border-accent-500/30 transition-all"
        >
          <span className="text-gray-500 text-[10px] mr-0.5">{f.category}:</span>
          {f.label}
          <X className="w-3 h-3 text-accent-400/60 group-hover:text-accent-400 transition-colors" />
        </button>
      ))}
      <span className="text-[10px] text-gray-600 ml-1">
        {filters.length} active filter{filters.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
