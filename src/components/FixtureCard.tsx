"use client";

import { useState } from "react";

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  minute?: number;
  competition: { id: number; name: string; emblem?: string };
  homeTeam: { id: number; name: string; crest?: string };
  awayTeam: { id: number; name: string; crest?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  predictedScore: { home: number; away: number };
  confidence: "high" | "medium" | "low";
  insights: string[];
  homeGoalsAvg?: number;
  awayGoalsAvg?: number;
  h2hCount?: number;
}

const LIVE_STATUSES = ["IN_PLAY", "PAUSED", "LIVE"];
const FINISHED_STATUSES = ["FINISHED", "AWARDED"];

export default function FixtureCard({ match }: { match: FDMatch }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { homeTeam, awayTeam, score } = match;
  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = FINISHED_STATUSES.includes(match.status);

  async function fetchPrediction() {
    if (prediction) { setOpen(!open); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/predict?homeId=${homeTeam.id}&awayId=${awayTeam.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrediction(data);
      setOpen(true);
    } catch (e) {
      console.error("Prediction failed", e);
    } finally {
      setLoading(false);
    }
  }

  const fixtureDate = new Date(match.utcDate);
  const time = fixtureDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const dateStr = fixtureDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });

  const outcomes = prediction ? [
    { label: homeTeam.name, prob: prediction.homeWin, color: "bg-blue-500" },
    { label: "Draw", prob: prediction.draw, color: "bg-yellow-500" },
    { label: awayTeam.name, prob: prediction.awayWin, color: "bg-red-500" },
  ] : [];
  const winner = prediction ? outcomes.reduce((a, b) => (a.prob > b.prob ? a : b)) : null;

  return (
    <div className="card mb-3">
      {/* Date + Status */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
        <span>{dateStr}</span>
        {isLive && (
          <span className="ml-auto text-green-400 font-semibold animate-pulse">LIVE</span>
        )}
        {!isLive && !isFinished && <span className="ml-auto text-gray-400 font-medium">{time}</span>}
        {isFinished && <span className="ml-auto text-gray-500">FT</span>}
      </div>

      {/* Teams + Score */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {homeTeam.crest && <img src={homeTeam.crest} alt={homeTeam.name} className="w-8 h-8 object-contain" />}
          <span className="font-semibold text-xs text-center leading-tight w-full truncate px-1">{homeTeam.name}</span>
        </div>
        <div className="text-center flex-shrink-0 min-w-[56px]">
          {(score.fullTime.home !== null && score.fullTime.away !== null) ? (
            <span className="text-lg font-bold tabular-nums">{score.fullTime.home} – {score.fullTime.away}</span>
          ) : (
            <span className="text-gray-500 text-sm font-medium">vs</span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          {awayTeam.crest && <img src={awayTeam.crest} alt={awayTeam.name} className="w-8 h-8 object-contain" />}
          <span className="font-semibold text-xs text-center leading-tight w-full truncate px-1">{awayTeam.name}</span>
        </div>
      </div>

      {/* Predict Button */}
      {!isFinished && (
        <div className="mt-3 text-center">
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="text-xs px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Analyzing..." : open ? "Hide Prediction" : isLive ? "🔮 Pre-match Prediction" : "🔮 Predict"}
          </button>
          {isLive && !open && (
            <p className="text-xs text-gray-600 mt-1">Based on pre-match stats — ignores current score</p>
          )}
        </div>
      )}

      {/* Prediction Panel */}
      {open && prediction && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
          {winner && (
            <div className="text-center bg-gray-900 rounded-xl py-3">
              <div className="text-xs text-gray-500 mb-0.5">Most likely outcome</div>
              <div className="font-bold text-white">{winner.label}</div>
              <div className="text-2xl font-black text-blue-400">{(winner.prob * 100).toFixed(0)}%</div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Confidence</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${prediction.confidence}`}>
              {prediction.confidence.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2">
            {outcomes.map(({ label, prob, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-28 truncate">{label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className={`${color} h-2 rounded-full`} style={{ width: `${(prob * 100).toFixed(0)}%` }} />
                </div>
                <span className="text-xs font-mono text-gray-300 w-10 text-right">{(prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="text-xs text-gray-500">Predicted score: </span>
            <span className="text-white font-bold">
              {prediction.predictedScore.home} – {prediction.predictedScore.away}
            </span>
          </div>

          {/* Based on */}
          <div className="bg-gray-900 rounded-xl p-3 space-y-1.5">
            <div className="text-xs text-gray-500 font-medium mb-2">📊 Based on</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Algorithm</span>
              <span className="text-gray-300">Poisson distribution + Elo</span>
            </div>
            {prediction.homeGoalsAvg !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{homeTeam.name} avg goals/game</span>
                <span className="text-gray-300">{prediction.homeGoalsAvg.toFixed(2)}</span>
              </div>
            )}
            {prediction.awayGoalsAvg !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{awayTeam.name} avg goals/game</span>
                <span className="text-gray-300">{prediction.awayGoalsAvg.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">H2H meetings analyzed</span>
              <span className="text-gray-300">{prediction.h2hCount ?? "—"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Home advantage</span>
              <span className="text-gray-300">1.2×</span>
            </div>
          </div>

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
