export interface Founder {
  name: string;
  role: string;
  background: string;
  linkedin?: string;
  previousCompanies: string[];
}

export interface FundingRound {
  round: string;
  amount: number;
  date: string;
  leadInvestor: string;
  investors: string[];
}

export interface Startup {
  id: string;
  name: string;
  logo: string;
  description: string;
  longDescription: string;
  industry: string;
  subIndustry: string;
  stage: "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C+";
  founded: number;
  headquarters: string;
  employeeCount: number;
  totalFunding: number;
  lastFundingDate: string;
  founders: Founder[];
  fundingRounds: FundingRound[];
  competitors: string[];
  technology: string[];
  tags: string[];
  growthSignal: "high" | "medium" | "low";
  aiInsight: string;
  strengths: string[];
  risks: string[];
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: "Active" | "Completed" | "Paused";
  companiesTracked: number;
  reports: number;
  lastUpdated: string;
  companies: string[];
  trends: string[];
  overview: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: "companies" | "founders" | "themes" | "deals";
  itemCount: number;
  lastUpdated: string;
  items: string[];
}

export interface MarketIntel {
  id: string;
  type: "new_startups" | "funding_round" | "trend" | "founder_move";
  title: string;
  subtitle: string;
  metric?: string;
  change?: string;
  timeLabel: string;
}

// ==================================================
// STARTUPS
// ==================================================

export const startups: Startup[] = [
  {
    id: "neural-labs",
    name: "Neural Labs",
    logo: "NL",
    description: "AI infrastructure for scientific discovery",
    longDescription:
      "Neural Labs builds foundational AI infrastructure that accelerates scientific research. Their platform enables research labs to train and deploy large-scale models for drug discovery, materials science, and genomics without needing dedicated ML engineering teams.",
    industry: "AI & Machine Learning",
    subIndustry: "AI Infrastructure",
    stage: "Seed",
    founded: 2023,
    headquarters: "San Francisco, CA",
    employeeCount: 24,
    totalFunding: 8_000_000,
    lastFundingDate: "2024-11-15",
    founders: [
      {
        name: "Dr. Sarah Chen",
        role: "CEO & Co-Founder",
        background:
          "PhD in Computational Biology from Stanford. Former Research Scientist at DeepMind where she led the protein folding infrastructure team.",
        previousCompanies: ["DeepMind", "Stanford Bioengineering"],
      },
      {
        name: "Marcus Rivera",
        role: "CTO & Co-Founder",
        background:
          "Previously Staff Engineer at NVIDIA working on distributed training systems. Built infrastructure serving 10,000+ GPUs.",
        previousCompanies: ["NVIDIA", "Google Cloud"],
      },
    ],
    fundingRounds: [
      {
        round: "Seed",
        amount: 8000000,
        date: "2024-11-15",
        leadInvestor: "Andreessen Horowitz",
        investors: ["Andreessen Horowitz", "Sequoia Capital", "Floodgate"],
      },
      {
        round: "Pre-seed",
        amount: 2000000,
        date: "2023-06-01",
        leadInvestor: "Floodgate",
        investors: ["Floodgate", "Y Combinator"],
      },
    ],
    competitors: ["Weights & Biases", "Modular", "Anyscale"],
    technology: ["Distributed Training", "GPU Orchestration", "MLOps", "AutoML"],
    tags: ["AI Infrastructure", "Scientific Computing", "Deep Tech"],
    growthSignal: "high",
    aiInsight:
      "Neural Labs addresses a critical bottleneck in AI-driven scientific research. With the convergence of foundation models and lab automation, the demand for specialized infrastructure will grow 5x by 2027. The founding team's DeepMind + NVIDIA pedigree is exceptionally rare.",
    strengths: [
      "Deep tech moat in distributed training optimization",
      "Founding team with unmatched domain expertise",
      "Early traction with top-10 pharma companies",
    ],
    risks: [
      "Enterprise sales cycles in pharma are 12-18 months",
      "Competing with well-funded open source alternatives",
      "GPU supply chain dependency",
    ],
  },
  {
    id: "robosynth",
    name: "RoboSynth",
    logo: "RS",
    description: "General-purpose robotics foundation models",
    longDescription:
      "RoboSynth develops foundational AI models for robotic manipulation. Their models enable any robot arm to learn complex manipulation tasks from natural language instructions, dramatically reducing the cost of deploying robots in manufacturing and logistics.",
    industry: "Robotics",
    subIndustry: "Robotics Software",
    stage: "Series A",
    founded: 2022,
    headquarters: "Boston, MA",
    employeeCount: 56,
    totalFunding: 32_000_000,
    lastFundingDate: "2025-02-20",
    founders: [
      {
        name: "Dr. James Park",
        role: "CEO",
        background:
          "PhD in Robotics from MIT. Former Research Lead at Boston Dynamics where he led manipulation research. 15+ publications in top robotics conferences.",
        previousCompanies: ["Boston Dynamics", "MIT CSAIL"],
      },
    ],
    fundingRounds: [
      {
        round: "Series A",
        amount: 24000000,
        date: "2025-02-20",
        leadInvestor: "Lux Capital",
        investors: ["Lux Capital", "Founders Fund", "Khosla Ventures"],
      },
      {
        round: "Seed",
        amount: 8000000,
        date: "2023-09-10",
        leadInvestor: "Khosla Ventures",
        investors: ["Khosla Ventures", "Y Combinator", "SV Angel"],
      },
    ],
    competitors: ["Physical Intelligence", "Skild AI", "Covariant"],
    technology: ["Foundation Models", "Imitation Learning", "Sim-to-Real Transfer", "Robot Control"],
    tags: ["Robotics", "Foundation Models", "Manufacturing"],
    growthSignal: "high",
    aiInsight:
      "RoboSynth is positioned at the intersection of two megatrends: foundation models and physical AI. The $200B industrial robotics market is ripe for disruption by general-purpose models that eliminate per-task programming. Their MIT/Boston Dynamics lineage gives them a significant talent advantage.",
    strengths: [
      "Pioneering foundation model approach for robotics",
      "Strong IP portfolio with 8 patents filed",
      "Pilot deployments with 3 Fortune 500 manufacturers",
    ],
    risks: [
      "Hardware-dependent deployment limits scalability",
      "Safety certification for industrial use is expensive",
      "Competition from well-funded Physical Intelligence ($400M raise)",
    ],
  },
  {
    id: "synthex-bio",
    name: "Synthex Bio",
    logo: "SB",
    description: "Programmable cell therapies using AI-designed proteins",
    longDescription:
      "Synthex Bio combines generative AI with synthetic biology to design novel therapeutic proteins. Their platform generates and tests millions of protein variants in silico, reducing the time to identify clinical candidates from years to months.",
    industry: "Biotech",
    subIndustry: "AI Drug Discovery",
    stage: "Series A",
    founded: 2021,
    headquarters: "Cambridge, MA",
    employeeCount: 72,
    totalFunding: 45_000_000,
    lastFundingDate: "2025-01-08",
    founders: [
      {
        name: "Dr. Elena Vasquez",
        role: "CEO & Co-Founder",
        background:
          "MD/PhD from Harvard-MIT. Former Principal Scientist at Moderna where she led the mRNA design platform. Rhodes Scholar.",
        previousCompanies: ["Moderna", "Broad Institute"],
      },
      {
        name: "Prof. David Kim",
        role: "Chief Scientific Officer",
        background:
          "Professor of Bioengineering at Stanford. Pioneer in computational protein design. 200+ publications, 15 patents.",
        previousCompanies: ["Stanford University"],
      },
    ],
    fundingRounds: [
      {
        round: "Series A",
        amount: 35000000,
        date: "2025-01-08",
        leadInvestor: "ARCH Venture Partners",
        investors: ["ARCH Venture Partners", "F-Prime Capital", "GV"],
      },
      {
        round: "Seed",
        amount: 10000000,
        date: "2023-03-15",
        leadInvestor: "GV",
        investors: ["GV", "Khosla Ventures"],
      },
    ],
    competitors: ["Generate Biomedicines", "Evozyne", "Profluent"],
    technology: ["Protein Design", "Generative AI", "High-Throughput Screening", "mRNA"],
    tags: ["Biotech", "AI Drug Discovery", "Deep Tech", "Protein Engineering"],
    growthSignal: "high",
    aiInsight:
      "Synthex Bio represents the next generation of AI-native biotech. Unlike traditional drug discovery that takes 5-7 years to identify a lead candidate, their platform can generate clinical candidates in under 12 months. The combination of Moderna operational experience and Stanford protein design expertise creates a formidable competitive advantage.",
    strengths: [
      "Validated platform with 3 internal programs in lead optimization",
      "World-class founding team with rare combination of AI + biology expertise",
      "Strong pharma partnership interest with 2 term sheets received",
    ],
    risks: [
      "Clinical validation still 18-24 months away",
      "Regulatory uncertainty around AI-designed biologics",
      "Talent war for ML engineers who understand biology",
    ],
  },
  {
    id: "solara-climate",
    name: "Solara Climate",
    logo: "SC",
    description: "Direct air capture with AI-optimized materials",
    longDescription:
      "Solara Climate develops next-generation direct air capture (DAC) systems powered by AI-discovered sorbent materials. Their machine learning platform has identified novel materials that capture CO2 at 40% lower energy cost than existing solutions.",
    industry: "Climate Tech",
    subIndustry: "Carbon Capture",
    stage: "Series B",
    founded: 2020,
    headquarters: "Oakland, CA",
    employeeCount: 94,
    totalFunding: 85_000_000,
    lastFundingDate: "2025-04-01",
    founders: [
      {
        name: "Amir Patel",
        role: "CEO",
        background:
          "Former VP of Engineering at Tesla Energy. Led the Powerwall manufacturing scale-up from prototype to 100K+ units.",
        previousCompanies: ["Tesla", "SunPower"],
      },
    ],
    fundingRounds: [
      {
        round: "Series B",
        amount: 55000000,
        date: "2025-04-01",
        leadInvestor: "Breakthrough Energy Ventures",
        investors: ["Breakthrough Energy Ventures", "Lowercarbon Capital", "Prelude Ventures"],
      },
      {
        round: "Series A",
        amount: 20000000,
        date: "2023-08-01",
        leadInvestor: "Lowercarbon Capital",
        investors: ["Lowercarbon Capital", "Prelude Ventures"],
      },
      {
        round: "Seed",
        amount: 10000000,
        date: "2021-12-01",
        leadInvestor: "Prelude Ventures",
        investors: ["Prelude Ventures", "Y Combinator"],
      },
    ],
    competitors: ["Climeworks", "Carbon Engineering", "Heirloom"],
    technology: ["Direct Air Capture", "Materials Science", "ML-Driven Discovery", "Process Engineering"],
    tags: ["Climate Tech", "Carbon Capture", "Deep Tech", "Sustainability"],
    growthSignal: "medium",
    aiInsight:
      "Direct air capture is projected to be a $100B+ market by 2035 driven by compliance carbon markets. Solara's AI materials discovery approach has yielded 3 novel sorbent families that outperform anything in the literature. Their Tesla-scale manufacturing expertise is the differentiator in an industry that struggles with deployment at industrial scale.",
    strengths: [
      "Proprietary sorbent materials with 40% cost advantage",
      "First commercial pilot producing 1,000 tons/year",
      "Strong policy tailwinds from IRA and EU carbon markets",
    ],
    risks: [
      "Capital-intensive deployment model",
      "Carbon credit prices are volatile",
      "Competing with nature-based solutions on cost per ton",
    ],
  },
  {
    id: "tesseract-finance",
    name: "Tesseract Finance",
    logo: "TF",
    description: "AI-native quantitative hedge fund infrastructure",
    longDescription:
      "Tesseract Finance provides the infrastructure layer for AI-native quantitative trading. Their platform enables hedge funds and asset managers to deploy machine learning models directly to production trading environments with institutional-grade risk controls and compliance.",
    industry: "Fintech",
    subIndustry: "Quantitative Finance",
    stage: "Seed",
    founded: 2024,
    headquarters: "New York, NY",
    employeeCount: 18,
    totalFunding: 6_000_000,
    lastFundingDate: "2024-10-01",
    founders: [
      {
        name: "Alex Zhang",
        role: "CEO",
        background:
          "Former Quantitative Trader at Jane Street. Built systematic trading strategies managing $2B AUM. CS degree from MIT.",
        previousCompanies: ["Jane Street", "Two Sigma"],
      },
      {
        name: "Priya Sharma",
        role: "CTO",
        background:
          "Staff Engineer at Stripe building financial infrastructure. Previously at Goldman Sachs electronic trading.",
        previousCompanies: ["Stripe", "Goldman Sachs"],
      },
    ],
    fundingRounds: [
      {
        round: "Seed",
        amount: 6000000,
        date: "2024-10-01",
        leadInvestor: "Founders Fund",
        investors: ["Founders Fund", "Ribbit Capital", "BoxGroup"],
      },
    ],
    competitors: ["Numerai", "QuantConnect", "Alpaca"],
    technology: ["ML Trading", "Risk Management", "Backtesting", "Market Data Pipelines"],
    tags: ["Fintech", "Quantitative Finance", "AI/ML"],
    growthSignal: "high",
    aiInsight:
      "Tesseract is democratizing quant trading infrastructure at a time when AI models are generating alpha that traditional strategies cannot match. The founding team's rare combination of Jane Street trading expertise and Stripe infrastructure engineering positions them to build the category-defining platform.",
    strengths: [
      "Exceptional founding team with top-tier trading + infra experience",
      "Already processing $500M+ in monthly trading volume from beta customers",
      "Regulatory compliance built in from day one",
    ],
    risks: [
      "Fintech regulatory landscape is complex and evolving",
      "Customer concentration risk with first 3 hedge fund clients",
      "AI model explainability requirements from regulators",
    ],
  },
  {
    id: "genesis-data",
    name: "Genesis Data",
    logo: "GD",
    description: "Synthetic data generation for enterprise AI training",
    longDescription:
      "Genesis Data generates high-fidelity synthetic datasets for training enterprise AI models. Their platform creates statistically accurate, privacy-preserving synthetic data that eliminates the bottleneck of real-world data scarcity in regulated industries.",
    industry: "AI & Machine Learning",
    subIndustry: "Synthetic Data",
    stage: "Seed",
    founded: 2023,
    headquarters: "Austin, TX",
    employeeCount: 15,
    totalFunding: 5_500_000,
    lastFundingDate: "2024-09-15",
    founders: [
      {
        name: "Rachel Okafor",
        role: "CEO",
        background:
          "Former ML Engineer at Scale AI. Built data pipelines processing 10M+ annotations daily. MS in CS from CMU.",
        previousCompanies: ["Scale AI", "Palantir"],
      },
    ],
    fundingRounds: [
      {
        round: "Seed",
        amount: 5500000,
        date: "2024-09-15",
        leadInvestor: "General Catalyst",
        investors: ["General Catalyst", "Y Combinator", "Liquid 2 Ventures"],
      },
    ],
    competitors: ["Gretel", "Mostly AI", "Tonic.ai"],
    technology: ["Synthetic Data", "Generative Models", "Privacy Engineering", "Data Quality"],
    tags: ["AI Infrastructure", "Enterprise", "Data"],
    growthSignal: "medium",
    aiInsight:
      "The synthetic data market is projected to reach $3.5B by 2028. Genesis Data's focus on regulated industries (finance, healthcare) creates a defensible niche where privacy compliance is mandatory rather than optional.",
    strengths: [
      "Strong enterprise pipeline with 2 F500 pilot customers",
      "Differentiated privacy guarantees with formal verification",
      "Modular architecture integrates with existing data pipelines",
    ],
    risks: [
      "Synthetic data quality skepticism in regulated industries",
      "Fierce competition from established players like Gretel",
      "Long enterprise sales cycles for new data infrastructure",
    ],
  },
];

// ==================================================
// RESEARCH PROJECTS
// ==================================================

export const researchProjects: ResearchProject[] = [
  {
    id: "ai-agents-2026",
    title: "AI Agents Market Map 2026",
    description: "Comprehensive analysis of the AI agent ecosystem including autonomous agents, copilots, and agent infrastructure.",
    status: "Active",
    companiesTracked: 127,
    reports: 8,
    lastUpdated: "2026-07-27",
    companies: ["neural-labs", "robosynth", "genesis-data"],
    trends: ["Autonomous workflows", "Multi-agent systems", "Agent orchestration", "Tool use & function calling"],
    overview:
      "The AI agent market is evolving from simple chat interfaces to autonomous workflows. Key segments include coding agents, customer service agents, and enterprise process automation. Total addressable market estimated at $50B by 2028.",
  },
  {
    id: "synbio-landscape",
    title: "Synthetic Biology Landscape",
    description: "Mapping the intersection of AI and synthetic biology including drug discovery, protein design, and bio manufacturing.",
    status: "Active",
    companiesTracked: 84,
    reports: 5,
    lastUpdated: "2026-07-26",
    companies: ["synthex-bio"],
    trends: ["AI-designed proteins", "mRNA therapeutics", "Gene editing 2.0", "Lab automation"],
    overview:
      "AI is accelerating every stage of the synthetic biology pipeline. Companies using generative AI for protein design have reduced candidate identification from years to months. The convergence of foundation models and high-throughput lab automation is creating a new class of AI-native biotech companies.",
  },
  {
    id: "robotics-ai",
    title: "Robotics + AI Convergence",
    description: "Analyzing the emerging wave of AI-powered robotics companies building general-purpose manipulation models.",
    status: "Active",
    companiesTracked: 63,
    reports: 4,
    lastUpdated: "2026-07-25",
    companies: ["robosynth"],
    trends: ["Foundation models for robotics", "Sim-to-real transfer", "Humanoid robots", "Manufacturing automation"],
    overview:
      "The robotics industry is undergoing a paradigm shift from task-specific programming to general-purpose foundation models. Companies building these models are attracting massive venture investment, with the top 5 players raising over $2B combined in 2025-2026.",
  },
];

// ==================================================
// COLLECTIONS
// ==================================================

export const collections: Collection[] = [
  {
    id: "ai-infra-investments",
    name: "AI Infrastructure Investments",
    description: "Startups building the picks and shovels for the AI gold rush",
    type: "companies",
    itemCount: 34,
    lastUpdated: "2026-07-27",
    items: ["neural-labs", "genesis-data"],
  },
  {
    id: "seed-investments-potential",
    name: "Potential Seed Investments",
    description: "Early-stage companies to watch for our next fund deployment",
    type: "companies",
    itemCount: 28,
    lastUpdated: "2026-07-26",
    items: ["tesseract-finance", "genesis-data"],
  },
  {
    id: "deep-tech-frontier",
    name: "Deep Tech Frontier",
    description: "Companies at the intersection of AI and hard science",
    type: "themes",
    itemCount: 47,
    lastUpdated: "2026-07-25",
    items: ["neural-labs", "synthex-bio", "robosynth"],
  },
  {
    id: "climate-portfolio",
    name: "Climate & Sustainability",
    description: "Climate tech companies with strong technical moats",
    type: "companies",
    itemCount: 22,
    lastUpdated: "2026-07-24",
    items: ["solara-climate"],
  },
];

// ==================================================
// MARKET INTELLIGENCE
// ==================================================

export const marketIntel: MarketIntel[] = [
  {
    id: "intel-1",
    type: "new_startups",
    title: "New AI infrastructure startups discovered",
    subtitle: "12 companies founded in the last 3 months",
    metric: "12",
    change: "+40%",
    timeLabel: "This week",
  },
  {
    id: "intel-2",
    type: "founder_move",
    title: "Former OpenAI researcher founded new company",
    subtitle: "Building next-gen agent infrastructure for enterprise",
    timeLabel: "2 days ago",
  },
  {
    id: "intel-3",
    type: "funding_round",
    title: "Robotics funding increased significantly",
    subtitle: "Q2 2026 saw record investment in AI robotics",
    metric: "34%",
    change: "+12pp",
    timeLabel: "This quarter",
  },
  {
    id: "intel-4",
    type: "trend",
    title: "Synthetic data emerges as critical infrastructure",
    subtitle: "5 new companies raised seed rounds this month",
    metric: "5",
    change: "+150%",
    timeLabel: "This month",
  },
  {
    id: "intel-5",
    type: "funding_round",
    title: "AI biotech deal activity accelerating",
    subtitle: "Average seed round size up significantly",
    metric: "$12M",
    change: "+65%",
    timeLabel: "vs Q1 2026",
  },
  {
    id: "intel-6",
    type: "founder_move",
    title: "DeepMind spinout trend continues",
    subtitle: "3 new companies founded by ex-DeepMind researchers",
    timeLabel: "This month",
  },
];
