import { getMatchesByDate, getTopLeagues } from "@/lib/api-football";
import FixtureCard from "@/components/FixtureCard";
import LeagueFilter from "@/components/LeagueFilter";
import { format, parseISO } from "date-fns";

function getParisDate(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
}

export const revalidate = 300;

// football-data.org match format
interface FDMatch {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED, etc.
  minute?: number;
  competition: { id: number; name: string; emblem?: string };
  homeTeam: { id: number; name: string; crest?: string };
  awayTeam: { id: number; name: string; crest?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

const FINISHED_STATUSES = ["FINISHED", "AWARDED", "POSTPONED", "CANCELLED", "SUSPENDED"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; league?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || getParisDate();
  const leagueFilter = sp.league ? Number(sp.league) : null;
  const topLeagues = await getTopLeagues();

  let matches: FDMatch[] = [];
  let error: string | null = null;

  try {
    const all = await getMatchesByDate(date);
    matches = (all || []).filter((m: FDMatch) => {
      const notFinished = !FINISHED_STATUSES.includes(m.status);
      const leagueMatch = leagueFilter ? m.competition.id === leagueFilter : true;
      return notFinished && leagueMatch;
    });
    // Sort: live first, then by time
    matches.sort((a: FDMatch, b: FDMatch) => {
      const aLive = ["IN_PLAY", "PAUSED", "LIVE"].includes(a.status) ? 0 : 1;
      const bLive = ["IN_PLAY", "PAUSED", "LIVE"].includes(b.status) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
    });
  } catch (e) {
    error = String(e);
  }

  // Group by competition
  const byLeague = matches.reduce((acc: Record<number, { comp: FDMatch["competition"]; matches: FDMatch[] }>, m) => {
    const id = m.competition.id;
    if (!acc[id]) acc[id] = { comp: m.competition, matches: [] };
    acc[id].matches.push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Today&apos;s Matches</h1>
        <p className="text-gray-500 text-sm">
          {format(parseISO(date), "EEEE, MMMM d, yyyy")} · {matches.length} upcoming/live matches
        </p>
      </div>

      <LeagueFilter leagues={topLeagues as (typeof topLeagues[0] & { group: string })[]} leagueFilter={leagueFilter} date={date} />

      {error && (
        <div className="card text-red-400 text-sm mb-4">Failed to load matches: {error}</div>
      )}

      {matches.length === 0 && !error && (
        <div className="card text-center text-gray-500 py-12">
          No upcoming matches today {leagueFilter ? "for this league" : ""} 😴
        </div>
      )}

      {Object.values(byLeague).map(({ comp, matches: lm }) => (
        <div key={comp.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {comp.emblem && <img src={comp.emblem} alt={comp.name} className="w-5 h-5" />}
            <h2 className="font-semibold text-sm text-gray-300">{comp.name}</h2>
          </div>
          {lm.map((m) => (
            <FixtureCard key={m.id} match={m} />
          ))}
        </div>
      ))}
    </div>
  );
}
