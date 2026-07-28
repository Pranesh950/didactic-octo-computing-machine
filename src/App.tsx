import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import CommandPalette from "@/components/layout/CommandPalette";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Scout from "@/pages/Scout";
import Research from "@/pages/Research";
import Collections from "@/pages/Collections";
import Briefing from "@/pages/Briefing";
import CompanyDetail from "@/pages/CompanyDetail";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Sparkles, Loader2 } from "lucide-react";

function Settings() {
  const { user, signOut } = useAuth();
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-gray-0">Settings</h1>
      <p className="text-sm text-gray-400 mt-1 font-mono">{user?.email}</p>
      <button
        onClick={signOut}
        className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-md text-[12px] font-mono hover:bg-gray-700 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

export default function App() {
  const { user, loading, signIn } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const shortcuts: Record<string, string> = {
          "1": "/",
          "2": "/discover",
          "3": "/scout",
          "4": "/research",
          "5": "/collections",
          "6": "/briefing",
        };
        if (shortcuts[e.key]) {
          e.preventDefault();
          navigate(shortcuts[e.key]);
        }
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0e10]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-400 animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-gray-500 font-mono">Loading StartupWiki…</p>
        </div>
      </div>
    );
  }

  // ── Login gate ─────────────────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0e10]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-7 h-7 text-accent-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-0 mb-2">StartupWiki Terminal</h1>
          <p className="text-[13px] text-gray-500 mb-8 font-mono leading-relaxed">
            AI-powered venture capital intelligence. Research startups, generate
            investment memos, and track markets — all with LangGraph agents.
          </p>
          <button
            onClick={signIn}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-gray-900 rounded-lg text-[14px] font-semibold hover:bg-gray-100 transition-colors font-mono"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Authenticated app ──────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0e10]">
      <Sidebar
        onOpenCommand={() => setCommandOpen(true)}
        userEmail={user.email ?? undefined}
      />
      <main className="flex-1 overflow-y-auto bg-[#0d0e10]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/scout" element={<Scout />} />
          <Route path="/research" element={<Research />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/briefing" element={<Briefing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
        </Routes>
      </main>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
