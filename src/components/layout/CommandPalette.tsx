import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ArrowRight, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  to?: string;
  action?: () => void;
}

const commands: CommandItem[] = [
  { id: "home", label: "Home", category: "Navigation", to: "/" },
  { id: "discover", label: "Discover startups", category: "Navigation", to: "/discover" },
  { id: "scout", label: "Scout — AI research", category: "Navigation", to: "/scout" },
  { id: "research", label: "Research projects", category: "Navigation", to: "/research" },
  { id: "collections", label: "Collections", category: "Navigation", to: "/collections" },
  { id: "settings", label: "Settings", category: "Navigation", to: "/settings" },
  { id: "neural", label: "Go to Neural Labs", category: "Companies", to: "/company/neural-labs" },
  { id: "robosynth", label: "Go to RoboSynth", category: "Companies", to: "/company/robosynth" },
  { id: "synthex", label: "Go to Synthex Bio", category: "Companies", to: "/company/synthex-bio" },
  { id: "search-companies", label: "Search all companies...", category: "Actions", to: "/discover" },
  { id: "scout-query", label: "New Scout query...", category: "Actions", to: "/scout" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item?.to) {
          navigate(item.to);
          onClose();
        } else if (item?.action) {
          item.action();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [filtered, selectedIndex, navigate, onClose],
  );

  // Global ⌘K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        // The parent toggles this, so we just handle close
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // Group filtered commands by category
  const grouped: Record<string, CommandItem[]> = {};
  for (const cmd of filtered) {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  }

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-modal overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-800">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-sm text-gray-0 placeholder:text-gray-500 focus:outline-none font-sans"
          />
          <kbd className="inline-flex items-center h-5 px-1.5 rounded text-[10px] font-mono text-gray-500 bg-gray-800 border border-gray-700">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">
                {category}
              </div>
              {items.map((item) => {
                const idx = globalIndex++;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left group",
                      isSelected
                        ? "bg-accent-500/15 text-accent-200"
                        : "text-gray-300 hover:bg-gray-800",
                    )}
                    onClick={() => {
                      if (item.to) {
                        navigate(item.to);
                        onClose();
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {item.to && "↵"}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-4 text-[10px] text-gray-500 font-mono">
          <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-gray-800">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-gray-800">↵</kbd> Open</span>
          <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-gray-800">esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
