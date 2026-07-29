import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, PanelLeftClose, PanelLeft } from "lucide-react";
import { startups } from "@/data/mock";
import type { Startup } from "@/data/mock";
import {
  INITIAL_FILTERS,
  useDiscoverEngine,
  extractFilterOptions,
  getActiveFilters,
} from "@/lib/discover-engine";
import type { FilterState, SortConfig } from "@/lib/discover-engine";
import DiscoverHeader from "@/components/discover/DiscoverHeader";
import DiscoverSidebar from "@/components/discover/DiscoverSidebar";
import ActiveFilters from "@/components/discover/ActiveFilters";
import DiscoverGrid from "@/components/discover/DiscoverGrid";
import QuickViewDrawer from "@/components/discover/QuickViewDrawer";

export default function Discover() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Startup | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filterOptions = extractFilterOptions(startups);
  const processed = useDiscoverEngine(startups, filters, sort);
  const activeFilters = getActiveFilters(filters, (updates) => setFilters((f) => ({ ...f, ...updates })));

  const handleViewFull = useCallback(
    (company: Startup) => {
      setSelectedCompany(null);
      navigate(`/company/${company.id}`);
    },
    [navigate],
  );

  // People mode is not yet implemented
  if (filters.mode === "people") {
    return (
      <div className="flex flex-col h-full">
        <DiscoverHeader
          mode={filters.mode}
          keyword={filters.keyword}
          onModeChange={(mode) => setFilters((f) => ({ ...f, mode }))}
          onKeywordChange={(keyword) => setFilters((f) => ({ ...f, keyword }))}
          resultCount={0}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-[14px] font-semibold text-gray-400 mb-1.5">People Search</h3>
            <p className="text-[12px] text-gray-600 max-w-[300px]">
              Founder and team member search is coming soon. Stay tuned.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <DiscoverHeader
        mode={filters.mode}
        keyword={filters.keyword}
        onModeChange={(mode) => setFilters((f) => ({ ...f, mode }))}
        onKeywordChange={(keyword) => setFilters((f) => ({ ...f, keyword }))}
        resultCount={processed.length}
      />

      {/* Body: sidebar + grid */}
      <div className="flex flex-1 min-h-0">
        {/* Filter Sidebar */}
        {!sidebarCollapsed && (
          <DiscoverSidebar
            filters={filters}
            options={filterOptions}
            onUpdate={(updates) => setFilters((f) => ({ ...f, ...updates }))}
          />
        )}
        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex-shrink-0 w-8 border-r border-gray-200 hover:bg-gray-100 transition-colors flex items-start justify-center pt-3 text-gray-400 hover:text-gray-600"
          title={sidebarCollapsed ? "Show filters" : "Hide filters"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Active filter tags */}
          <ActiveFilters filters={activeFilters} />

          {/* Data grid */}
          <DiscoverGrid
            data={processed}
            sort={sort}
            onSort={setSort}
            onSelectCompany={setSelectedCompany}
          />
        </div>
      </div>

      {/* Quick View Drawer */}
      <QuickViewDrawer
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        onViewFull={handleViewFull}
      />
    </div>
  );
}
