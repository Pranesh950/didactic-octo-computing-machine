import { Link } from "react-router-dom";
import { TrendingUp, BookOpen, Sparkles, Users, DollarSign, Clock, ChevronRight } from "lucide-react";
import { marketIntel, researchProjects, startups } from "@/data/mock";
import Card from "@/components/shared/Card";
import CompanyCard from "@/components/shared/CompanyCard";
import Badge from "@/components/shared/Badge";

const intelIcons = {
  new_startups: Users,
  funding_round: DollarSign,
  trend: TrendingUp,
  founder_move: Sparkles,
} as const;

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-gray-0">Good morning, Pranesh</h1>
        <p className="text-[13px] text-gray-400 mt-1 font-mono">Startup intelligence briefing</p>
      </div>

      {/* A) Market Intelligence Feed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-[13px] font-semibold text-gray-200 uppercase tracking-wider">Market Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {marketIntel.map((intel) => {
            const Icon = intelIcons[intel.type];
            return (
              <Card key={intel.id} padding="sm" hover>
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-accent-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-100 leading-snug">{intel.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{intel.subtitle}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {intel.metric && (
                        <span className="text-xs font-bold text-gray-200 font-mono">{intel.metric}</span>
                      )}
                      {intel.change && (
                        <Badge variant="success" size="sm">{intel.change}</Badge>
                      )}
                      <span className="text-[10px] text-gray-600 ml-auto font-mono">
                        {intel.timeLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* B) Saved Research */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-400" />
            <h2 className="text-[13px] font-semibold text-gray-200 uppercase tracking-wider">Research</h2>
          </div>
          <Link to="/collections" className="text-[12px] text-accent-400 hover:text-accent-300 flex items-center gap-1 font-mono transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {researchProjects.slice(0, 3).map((project) => (
            <Link key={project.id} to="/collections">
              <Card padding="sm" hover>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-100">{project.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">
                      {project.companiesTracked} companies · {project.reports} reports
                    </p>
                  </div>
                  <Badge variant="success" size="sm">{project.status}</Badge>
                </div>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-600 font-mono">
                  <Clock className="w-3 h-3" />
                  Updated {project.lastUpdated}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

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
