import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import CommandPalette from "@/components/layout/CommandPalette";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Scout from "@/pages/Scout";
import Collections from "@/pages/Collections";
import CompanyDetail from "@/pages/CompanyDetail";
import { useAuth } from "@/contexts/AuthContext";
import Landing from "@/pages/Landing";
import { Loader2 } from "lucide-react";

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
  const { user, loading } = useAuth();
  const [commandOpen, setCommandOpen] = useState(false);
  const navigate = useNavigate();

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);

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
          "4": "/collections",
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
      <div className="flex items-center justify-center h-screen bg-gray-1000">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-400 animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-gray-500 font-mono">Loading StartupWiki…</p>
        </div>
      </div>
    );
  }

  // ── Login gate ── landing page ──────────────────────
  if (!user) {
    return <Landing />;
  }

  // ── Authenticated app ──────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-1000">
      <Sidebar
        onOpenCommand={openCommand}
        userEmail={user.email ?? undefined}
      />
      <main className="flex-1 overflow-y-auto bg-gray-1000">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/scout" element={<Scout />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
        </Routes>
      </main>
      <CommandPalette open={commandOpen} onClose={closeCommand} />
    </div>
  );
}
