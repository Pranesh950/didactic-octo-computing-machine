import { memo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Crosshair,
  FolderOpen,
  Sparkles,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home", shortcut: "H" },
  { to: "/discover", icon: Search, label: "Discover", shortcut: "D" },
  { to: "/scout", icon: Crosshair, label: "Scout", shortcut: "S" },
  { to: "/collections", icon: FolderOpen, label: "Collections", shortcut: "C" },
];

interface SidebarProps {
  onOpenCommand?: () => void;
  userEmail?: string;
}

const Sidebar = memo(function Sidebar({ onOpenCommand, userEmail }: SidebarProps) {
  return (
    <aside className="w-52 bg-[#0a0b0d] text-gray-300 flex flex-col flex-shrink-0 border-r border-gray-800 select-none">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold text-gray-0 tracking-tight leading-tight">
              StartupWiki
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight font-mono uppercase tracking-wider">
              Terminal
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-75 group",
                isActive
                  ? "bg-gray-800 text-gray-0"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/70",
              )
            }
          >
            <item.icon className={cn("w-4 h-4 flex-shrink-0")} />
            <span className="flex-1">{item.label}</span>
            <kbd className="hidden group-hover:inline-flex items-center h-4 px-1.5 rounded text-[9px] font-mono font-medium bg-gray-700 text-gray-300">
              {item.shortcut}
            </kbd>
          </NavLink>
        ))}
      </nav>

      {/* Command palette trigger */}
      <div className="px-2.5 pb-2">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-gray-400 hover:text-gray-200 hover:bg-gray-900/70 transition-colors group"
        >
          <Command className="w-4 h-4" />
          <span className="flex-1 text-left">Command menu</span>
          <kbd className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded text-[10px] font-mono font-medium bg-gray-800 text-gray-400">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-800 flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
          <span className="text-[8px] font-bold text-accent-400">{userEmail?.[0]?.toUpperCase() ?? "U"}</span>
        </div>
        <span className="text-[12px] text-gray-400 font-medium truncate">{userEmail ?? "User"}</span>
      </div>
    </aside>
  );
});

export default Sidebar;
