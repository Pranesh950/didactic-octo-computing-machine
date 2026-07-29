"""VC Scoring Engine — quantitative startup evaluation model.

Scores companies across three dimensions on a 1-10 scale:
- Team Score: Founder pedigree, domain expertise, previous exits
- Market Score: TAM, growth rate, competitive positioning
- Traction Score: Revenue, growth rate, funding quality, customer adoption

Overall Score is a weighted composite.
"""

from __future__ import annotations

from typing import Any


def calculate_vc_score(company: dict[str, Any]) -> dict[str, Any]:
    """Calculate quantitative VC scores for a company.

    Returns a dict with team_score, market_score, traction_score,
    overall_score (all out of 10), and a rationale string.
    """
    team = _score_team(company)
    market = _score_market(company)
    traction = _score_traction(company)
    overall = round((team * 0.35 + market * 0.30 + traction * 0.35), 1)

    return {
        "team_score": team,
        "market_score": market,
        "traction_score": traction,
        "overall_score": overall,
        "rating": _rating_label(overall),
        "rationale": _build_rationale(company, team, market, traction, overall),
        "investor_quality": _investor_tier_label(company.get("investor_quality_tier", 3)),
    }


def _score_team(c: dict[str, Any]) -> float:
    """Score the founding team (1-10)."""
    score = 5.0  # baseline

    founders = c.get("founders", [])
    if not founders:
        return score

    # Founder count bonus (2+ founders is better)
    if len(founders) >= 2:
        score += 1.0

    # Previous company pedigree
    tier1_companies = [
        "deepmind", "openai", "google", "meta", "stripe", "nvidia",
        "spacex", "tesla", "jane street", "palantir", "scale ai",
        "a16z", "sequoia", "benchmark", "github", "microsoft",
        "crowdstrike", "unit 8200", "darpa", "nasa", "moderna",
    ]
    tier2_companies = [
        "amazon", "apple", "netflix", "uber", "airbnb", "snap",
        "dropbox", "slack", "notion", "figma", "vercel",
        "y combinator", "goldman sachs", "mckinsey", "bain",
    ]

    for f in founders:
        prev = [p.lower() for p in f.get("previous_companies", [])]
        for pc in prev:
            if any(t in pc for t in tier1_companies):
                score += 1.5
            elif any(t in pc for t in tier2_companies):
                score += 0.5

    # Academic background
    top_schools = ["stanford", "mit", "harvard", "berkeley", "cmu", "oxford", "cambridge", "caltech", "princeton"]
    for f in founders:
        bg = f.get("background", "").lower()
        if any(s in bg for s in top_schools):
            score += 0.5

        # PhD is a strong signal for deep tech
        if "phd" in bg:
            score += 0.5

    # Founder-market fit: CEO with relevant industry experience
    ceo = founders[0] if founders else {}
    ceo_bg = ceo.get("background", "").lower()
    industry = c.get("industry", "").lower()
    if industry and industry.lower() in ceo_bg:
        score += 1.0

    return min(10.0, max(1.0, round(score, 1)))


def _score_market(c: dict[str, Any]) -> float:
    """Score the market opportunity (1-10)."""
    score = 5.0

    # TAM size
    tam = c.get("market_size_billions", 1)
    if tam >= 100:
        score += 3.0
    elif tam >= 50:
        score += 2.0
    elif tam >= 20:
        score += 1.5
    elif tam >= 5:
        score += 0.5

    # Moat / defensibility
    moat = c.get("moat_score", 5)
    score += (moat - 5) * 0.5

    # Stage adjustment (earlier = more upside)
    stage = c.get("stage", "")
    if stage in ("Pre-seed", "Seed"):
        score += 1.0  # more room to capture market

    return min(10.0, max(1.0, round(score, 1)))


def _score_traction(c: dict[str, Any]) -> float:
    """Score the company's traction and momentum (1-10)."""
    score = 5.0

    # Growth rate
    growth = c.get("growth_rate_yoy", 0)
    if growth >= 300:
        score += 3.0
    elif growth >= 200:
        score += 2.0
    elif growth >= 100:
        score += 1.0
    elif growth > 0:
        score += 0.5

    # Revenue / scale
    rev = c.get("revenue_range", "")
    if "$10M" in rev or "$15M" in rev:
        score += 2.0
    elif "$5M" in rev or "$8M" in rev:
        score += 1.5
    elif "$2M" in rev or "$4M" in rev or "$3M" in rev:
        score += 1.0
    elif "$500K" in rev or "$1M" in rev:
        score += 0.5

    # Investor quality
    tier = c.get("investor_quality_tier", 3)
    if tier == 1:
        score += 1.5
    elif tier == 2:
        score += 0.5

    # Stage progression (Series B+ = more de-risked)
    stage = c.get("stage", "")
    if stage in ("Series B", "Series C+"):
        score += 1.0
    elif stage == "Series A":
        score += 0.5

    return min(10.0, max(1.0, round(score, 1)))


def _rating_label(score: float) -> str:
    """Convert numeric score to a rating label."""
    if score >= 8.5:
        return "Exceptional — top 1% of venture deals"
    elif score >= 7.5:
        return "Strong — clear venture-backable opportunity"
    elif score >= 6.5:
        return "Good — worth deeper diligence"
    elif score >= 5.5:
        return "Average — needs more evidence of breakout potential"
    else:
        return "Below Average — high risk, unclear upside"


def _investor_tier_label(tier: int) -> str:
    """Convert investor tier to a label."""
    labels = {1: "Tier 1 (a16z, Sequoia, Benchmark, etc.)", 2: "Tier 2 (strong franchise funds)", 3: "Tier 3 (early-stage / niche)"}
    return labels.get(tier, "Unknown")


def _build_rationale(c: dict, team: float, market: float, traction: float, overall: float) -> str:
    """Build a short rationale for the scores."""
    parts = []

    if team >= 8:
        parts.append(f"Elite founding team ({team}/10)")
    elif team >= 6:
        parts.append(f"Strong team ({team}/10)")
    else:
        parts.append(f"Average team ({team}/10)")

    if market >= 8:
        parts.append(f"massive market opportunity ({market}/10)")
    elif market >= 6:
        parts.append(f"solid market ({market}/10)")
    else:
        parts.append(f"limited market ({market}/10)")

    if traction >= 8:
        parts.append(f"exceptional traction ({traction}/10)")
    elif traction >= 6:
        parts.append(f"good traction ({traction}/10)")
    else:
        parts.append(f"early traction ({traction}/10)")

    return f"{', '.join(parts)}. Overall: {overall}/10 — {_rating_label(overall)}"


def score_multiple(companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Score multiple companies and return ranked list."""
    scored = []
    for c in companies:
        scores = calculate_vc_score(c)
        scored.append({**c, "vc_scores": scores})
    scored.sort(key=lambda x: x["vc_scores"]["overall_score"], reverse=True)
    return scored
