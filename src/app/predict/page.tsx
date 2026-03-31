"use client";

import { useState, useRef, useEffect } from "react";

interface Team {
  id: number;
  name: string;
  logo: string;
  country: string;
  city?: string;
}

interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: { home: number; away: number };
  confidence: "high" | "medium" | "low";
  insights: string[];
  homeForm: string[];
  awayForm: string[];
  h2hCount: number;
}

function TeamSearch({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: Team | null;
  onSelect: (team: Team) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.teams || []);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function select(team: Team) {
    onSelect(team);
    setQuery(team.name);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {selected && query === selected.name ? (
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5 border border-blue-500">
          <img src={selected.logo} alt={selected.name} className="w-7 h-7" />
          <span className="font-semibold text-sm">{selected.name}</span>
          <span className="text-xs text-gray-500 ml-1">{selected.country}</span>
          <button
            onClick={() => { setQuery(""); onSelect(null as unknown as Team); }}
            className="ml-auto text-gray-500 hover:text-gray-300 text-lg leading-none"
          >×</button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={`Search ${label}...`}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          {results.map((team) => (
            <button
              key={team.id}
              onClick={() => select(team)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition-colors text-left"
            >
              <img src={team.logo} alt={team.name} className="w-6 h-6" />
              <span className="text-sm">{team.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{team.country}</span>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-8 text-gray-500 text-xs">searching...</div>
      )}
    </div>
  );
}

function FormBadge({ result }: { result: string }) {
  const colors: Record<string, string> = {
    W: "bg-green-700 text-green-200",
    D: "bg-yellow-700 text-yellow-200",
    L: "bg-red-800 text-red-200",
  };
  return (
    <span className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${colors[result] || "bg-gray-700"}`}>
      {result}
    </span>
  );
}

export default function PredictPage() {
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPrediction() {
    if (!homeTeam || !awayTeam) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const res = await fetch(`/api/predict-teams?homeId=${homeTeam.id}&awayId=${awayTeam.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrediction(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const outcomes = prediction ? [
    { label: homeTeam?.name || "Home", prob: prediction.homeWin, color: "bg-blue-500" },
    { label: "Draw", prob: prediction.draw, color: "bg-yellow-500" },
    { label: awayTeam?.name || "Away", prob: prediction.awayWin, color: "bg-red-500" },
  ] : [];

  const winner = prediction
    ? outcomes.reduce((a, b) => (a.prob > b.prob ? a : b))
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">🔮 Match Predictor</h1>
        <p className="text-gray-500 text-sm">Search any two teams and get a data-driven prediction</p>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <TeamSearch label="Home Team" selected={homeTeam} onSelect={setHomeTeam} />
          <TeamSearch label="Away Team" selected={awayTeam} onSelect={setAwayTeam} />
        </div>

        <button
          onClick={runPrediction}
          disabled={!homeTeam || !awayTeam || loading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
        >
          {loading ? "⚡ Analyzing..." : "🔮 Predict Match"}
        </button>
      </div>

      {error && (
        <div className="card text-red-400 text-sm mb-4">{error}</div>
      )}

      {prediction && homeTeam && awayTeam && (
        <div className="card space-y-5">
          {/* Teams header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-10 h-10" />
              <span className="font-bold">{homeTeam.name}</span>
            </div>
            <span className="text-gray-500 font-bold text-sm">VS</span>
            <div className="flex items-center gap-2 flex-row-reverse">
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-10 h-10" />
              <span className="font-bold text-right">{awayTeam.name}</span>
            </div>
          </div>

          {/* Winner callout */}
          {winner && (
            <div className="text-center bg-gray-900 rounded-xl py-3">
              <div className="text-xs text-gray-500 mb-0.5">Most likely outcome</div>
              <div className="text-lg font-bold text-white">{winner.label}</div>
              <div className="text-2xl font-black text-blue-400">{(winner.prob * 100).toFixed(0)}%</div>
            </div>
          )}

          {/* Predicted score */}
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Predicted score</div>
            <div className="text-3xl font-black">
              {prediction.predictedScore.home} – {prediction.predictedScore.away}
            </div>
          </div>

          {/* Probability bars */}
          <div className="space-y-2">
            {outcomes.map(({ label, prob, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-28 truncate">{label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2.5">
                  <div
                    className={`${color} h-2.5 rounded-full`}
                    style={{ width: `${(prob * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-300 w-10 text-right">
                  {(prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {/* Confidence + H2H */}
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium badge-${prediction.confidence}`}>
              {prediction.confidence.toUpperCase()} CONFIDENCE
            </span>
            <span className="text-gray-500">
              Based on {prediction.h2hCount} H2H meetings
            </span>
          </div>

          {/* Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1.5">{homeTeam.name} — last 5</div>
              <div className="flex gap-1">
                {prediction.homeForm.length > 0
                  ? prediction.homeForm.map((r, i) => <FormBadge key={i} result={r} />)
                  : <span className="text-xs text-gray-600">No data</span>
                }
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1.5">{awayTeam.name} — last 5</div>
              <div className="flex gap-1">
                {prediction.awayForm.length > 0
                  ? prediction.awayForm.map((r, i) => <FormBadge key={i} result={r} />)
                  : <span className="text-xs text-gray-600">No data</span>
                }
              </div>
            </div>
          </div>

          {/* Insights */}
          {prediction.insights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prediction.insights.map((insight) => (
                <span key={insight} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  💡 {insight}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
