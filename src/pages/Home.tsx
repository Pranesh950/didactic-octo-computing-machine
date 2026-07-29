import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useStartups } from "@/hooks/useStartups";
import CompanyCard from "@/components/shared/CompanyCard";

export default function Home() {
  const { startups } = useStartups();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-gray-0">Good morning, Pranesh</h1>
        <p className="text-[13px] text-gray-400 mt-1 font-mono">Startup intelligence briefing</p>
      </div>

      {/* C) Recommended Companies */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-400" />
            <h2 className="text-[13px] font-semibold text-gray-200 uppercase tracking-wider">Recommended</h2>
          </div>
          <Link to="/discover" className="text-[12px] text-accent-400 hover:text-accent-300 flex items-center gap-1 font-mono transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {startups.slice(0, 3).map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>
    </div>
  );
}
