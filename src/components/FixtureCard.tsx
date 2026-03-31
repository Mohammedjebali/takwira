"use client";

import { useState } from "react";

interface Fixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { id: number; name: string; logo: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null } };
}

interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: { home: number; away: number };
  confidence: "high" | "medium" | "low";
  insights: string[];
}

export default function FixtureCard({ fixture }: { fixture: Fixture }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { teams, goals, league } = fixture;
  const status = fixture.fixture.status.short;
  const isLive = status === "1H" || status === "2H" || status === "HT";
  const isFinished = status === "FT" || status === "AET" || status === "PEN";

  async function fetchPrediction() {
    if (prediction) { setOpen(!open); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/predict?homeId=${teams.home.id}&awayId=${teams.away.id}&leagueId=${league.id}&season=${league.season}`
      );
      const data = await res.json();
      setPrediction(data);
      setOpen(true);
    } catch {
      console.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  const time = new Date(fixture.fixture.date).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="card mb-3">
      {/* League */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
        <img src={league.logo} alt={league.name} className="w-4 h-4" />
        <span>{league.name}</span>
        {isLive && (
          <span className="ml-auto text-green-400 font-semibold animate-pulse">
            LIVE {fixture.fixture.status.elapsed}&apos;
          </span>
        )}
        {!isLive && !isFinished && <span className="ml-auto text-gray-400">{time}</span>}
        {isFinished && <span className="ml-auto text-gray-500">FT</span>}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <img src={teams.home.logo} alt={teams.home.name} className="w-8 h-8" />
          <span className="font-semibold text-sm">{teams.home.name}</span>
        </div>

        <div className="text-center min-w-[60px]">
          {(goals.home !== null && goals.away !== null) ? (
            <span className="text-xl font-bold">
              {goals.home} - {goals.away}
            </span>
          ) : (
            <span className="text-gray-500 text-sm">vs</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="font-semibold text-sm text-right">{teams.away.name}</span>
          <img src={teams.away.logo} alt={teams.away.name} className="w-8 h-8" />
        </div>
      </div>

      {/* Predict Button — only for upcoming matches */}
      {!isLive && !isFinished && (
        <div className="mt-3 text-center">
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="text-xs px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Analyzing..." : open ? "Hide Prediction" : "🔮 Predict"}
          </button>
        </div>
      )}
      {isLive && (
        <div className="mt-3 text-center text-xs text-gray-600">
          Match in progress — prediction not available
        </div>
      )}

      {/* Prediction Panel */}
      {open && prediction && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          {/* Confidence badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Prediction</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${prediction.confidence}`}>
              {prediction.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>

          {/* Win/Draw/Lose bars */}
          <div className="space-y-2 mb-4">
            {[
              { label: teams.home.name, prob: prediction.homeWin, color: "bg-blue-500" },
              { label: "Draw", prob: prediction.draw, color: "bg-yellow-500" },
              { label: teams.away.name, prob: prediction.awayWin, color: "bg-red-500" },
            ].map(({ label, prob, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-28 truncate">{label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${(prob * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-300 w-10 text-right">
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {/* Predicted Score */}
          <div className="text-center mb-3">
            <span className="text-xs text-gray-500">Most likely score: </span>
            <span className="text-white font-bold">
              {prediction.predictedScore.home} - {prediction.predictedScore.away}
            </span>
          </div>

          {/* Insights */}
          {prediction.insights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prediction.insights.map((insight) => (
                <span key={insight} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {insight}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
