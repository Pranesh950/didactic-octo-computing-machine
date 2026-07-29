import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState, FilterOptions } from "@/lib/discover-engine";

interface FilterDropdownProps {
  label: string;
  count: number;
  children: React.ReactNode;
}

function FilterDropdown({ label, count, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-800/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-gray-300">{label}</span>
          {count > 0 && (
            <span className="w-4 h-4 rounded-full bg-accent-500/20 border border-accent-500/30 text-[9px] font-bold text-accent-400 flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

interface CheckboxFilterProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function CheckboxFilter({ options, selected, onChange }: CheckboxFilterProps) {
  return (
    <div className="space-y-1 max-h-[180px] overflow-y-auto">
      {options.map((option) => {
        const checked = selected.includes(option);
        return (
          <label
            key={option}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
              checked ? "bg-accent-500/5" : "hover:bg-gray-900/40",
            )}
          >
            <div
              className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                checked
                  ? "bg-accent-500 border-accent-500"
                  : "border-gray-700 group-hover:border-gray-600",
              )}
            >
              {checked && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="currentColor">
                  <path d="M9.5 2.5L4.5 8L2.5 6L1.5 7L4.5 10L10.5 3.5L9.5 2.5Z" />
                </svg>
              )}
            </div>
            <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors truncate">
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  valueMin: number | null;
  valueMax: number | null;
  formatValue: (v: number) => string;
  onChangeMin: (v: number | null) => void;
  onChangeMax: (v: number | null) => void;
}

function RangeFilter({
  label,
  min,
  max,
  valueMin,
  valueMax,
  formatValue,
  onChangeMin,
  onChangeMax,
}: RangeFilterProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={formatValue(min)}
          value={valueMin ?? ""}
          onChange={(e) => onChangeMin(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-md text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-accent-500/40 focus:outline-none transition-colors"
        />
        <span className="text-[10px] text-gray-600">–</span>
        <input
          type="number"
          placeholder={formatValue(max)}
          value={valueMax ?? ""}
          onChange={(e) => onChangeMax(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-md text-[11px] text-gray-200 placeholder:text-gray-600 focus:border-accent-500/40 focus:outline-none transition-colors"
        />
      </div>
      <p className="text-[10px] text-gray-600">{label} range: {formatValue(min)} – {formatValue(max)}</p>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────

interface Props {
  filters: FilterState;
  options: FilterOptions;
  onUpdate: (updates: Partial<FilterState>) => void;
}

export default function DiscoverSidebar({ filters, options, onUpdate }: Props) {
  const activeCount =
    filters.industries.length +
    filters.stages.length +
    filters.growthSignals.length +
    filters.headquarters.length +
    (filters.fundingMin !== null || filters.fundingMax !== null ? 1 : 0) +
    (filters.foundedMin !== null || filters.foundedMax !== null ? 1 : 0) +
    (filters.employeesMin !== null || filters.employeesMax !== null ? 1 : 0);

  return (
    <div className="w-[260px] flex-shrink-0 border-r border-gray-800/60 bg-gray-950 overflow-y-auto">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-gray-800/60 flex items-center gap-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[12px] font-semibold text-gray-200">Filters</span>
        {activeCount > 0 && (
          <span className="ml-auto text-[10px] text-accent-400 font-medium">
            {activeCount} active
          </span>
        )}
      </div>

      {/* Industry */}
      <FilterDropdown label="Industry" count={filters.industries.length}>
        <CheckboxFilter
          options={options.industries}
          selected={filters.industries}
          onChange={(industries) => onUpdate({ industries })}
        />
      </FilterDropdown>

      {/* Stage */}
      <FilterDropdown label="Stage" count={filters.stages.length}>
        <CheckboxFilter
          options={options.stages}
          selected={filters.stages}
          onChange={(stages) => onUpdate({ stages })}
        />
      </FilterDropdown>

      {/* Growth Signal */}
      <FilterDropdown label="Growth Signal" count={filters.growthSignals.length}>
        <CheckboxFilter
          options={options.growthSignals}
          selected={filters.growthSignals}
          onChange={(growthSignals) => onUpdate({ growthSignals })}
        />
      </FilterDropdown>

      {/* Headquarters */}
      <FilterDropdown label="Headquarters" count={filters.headquarters.length}>
        <CheckboxFilter
          options={options.headquarters}
          selected={filters.headquarters}
          onChange={(headquarters) => onUpdate({ headquarters })}
        />
      </FilterDropdown>

      {/* Funding Range */}
      <FilterDropdown label="Funding Range" count={filters.fundingMin !== null || filters.fundingMax !== null ? 1 : 0}>
        <RangeFilter
          label="Funding"
          min={options.fundingRange.min}
          max={options.fundingRange.max}
          valueMin={filters.fundingMin}
          valueMax={filters.fundingMax}
          formatValue={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
          onChangeMin={(fundingMin) => onUpdate({ fundingMin })}
          onChangeMax={(fundingMax) => onUpdate({ fundingMax })}
        />
      </FilterDropdown>

      {/* Founded Year */}
      <FilterDropdown label="Founded Year" count={filters.foundedMin !== null || filters.foundedMax !== null ? 1 : 0}>
        <RangeFilter
          label="Year"
          min={options.foundedRange.min}
          max={options.foundedRange.max}
          valueMin={filters.foundedMin}
          valueMax={filters.foundedMax}
          formatValue={(v) => String(v)}
          onChangeMin={(foundedMin) => onUpdate({ foundedMin })}
          onChangeMax={(foundedMax) => onUpdate({ foundedMax })}
        />
      </FilterDropdown>

      {/* Employee Count */}
      <FilterDropdown label="Employees" count={filters.employeesMin !== null || filters.employeesMax !== null ? 1 : 0}>
        <RangeFilter
          label="Employees"
          min={options.employeesRange.min}
          max={options.employeesRange.max}
          valueMin={filters.employeesMin}
          valueMax={filters.employeesMax}
          formatValue={(v) => String(v)}
          onChangeMin={(employeesMin) => onUpdate({ employeesMin })}
          onChangeMax={(employeesMax) => onUpdate({ employeesMax })}
        />
      </FilterDropdown>

      {/* Clear all */}
      {activeCount > 0 && (
        <div className="p-4">
          <button
            onClick={() =>
              onUpdate({
                industries: [],
                stages: [],
                growthSignals: [],
                headquarters: [],
                fundingMin: null,
                fundingMax: null,
                foundedMin: null,
                foundedMax: null,
                employeesMin: null,
                employeesMax: null,
                keyword: filters.keyword,
              })
            }
            className="w-full py-2 rounded-lg text-[11px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 border border-red-500/15 transition-all"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
