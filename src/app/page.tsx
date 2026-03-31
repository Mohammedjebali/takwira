import { getFixturesByDate, getTopLeagues } from "@/lib/api-football";
import FixtureCard from "@/components/FixtureCard";
import { format } from "date-fns";

export const revalidate = 300; // refresh every 5 min

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

// No longer used for filtering — just kept for reference
// const TOP_LEAGUE_IDS = [2, 3, 39, 140, 135, 78, 61, 207];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; league?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || format(new Date(), "yyyy-MM-dd");
  const leagueFilter = sp.league ? Number(sp.league) : null;
  const topLeagues = await getTopLeagues();

  let fixtures: Fixture[] = [];
  let error: string | null = null;

  try {
    const all = await getFixturesByDate(date);
    const FINISHED = ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "INT", "PST"];
    // Show only upcoming + live (not finished), or filter by selected league
    fixtures = (all || []).filter((f: Fixture) => {
      const notFinished = !FINISHED.includes(f.fixture.status.short);
      const leagueMatch = leagueFilter ? f.league.id === leagueFilter : true;
      return notFinished && leagueMatch;
    });
    // Sort: live first, then by time
    fixtures.sort((a: Fixture, b: Fixture) => {
      const aLive = ["1H","2H","HT"].includes(a.fixture.status.short) ? 0 : 1;
      const bLive = ["1H","2H","HT"].includes(b.fixture.status.short) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
    });
  } catch (e) {
    error = String(e);
  }

  // Group by league
  const byLeague = fixtures.reduce((acc: Record<number, { league: Fixture["league"]; fixtures: Fixture[] }>, f) => {
    const id = f.league.id;
    if (!acc[id]) acc[id] = { league: f.league, fixtures: [] };
    acc[id].fixtures.push(f);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Today&apos;s Matches</h1>
        <p className="text-gray-500 text-sm">
          {format(new Date(date), "EEEE, MMMM d, yyyy")} · {fixtures.length} upcoming/live matches
        </p>
      </div>

      {/* League filter — grouped by country */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3 flex-wrap">
          <a
            href={`?date=${date}`}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${!leagueFilter ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
          >
            🌍 All
          </a>
          {/* Group pills by country group */}
          {Array.from(new Set(topLeagues.map((l) => (l as { group: string } & typeof l).group))).map((group) => {
            const groupLeagues = topLeagues.filter((l) => (l as { group: string } & typeof l).group === group);
            const isGroupActive = groupLeagues.some((l) => l.id === leagueFilter);
            return (
              <div key={group} className="relative group">
                <button className={`px-3 py-1.5 rounded-full text-xs transition-colors ${isGroupActive ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}>
                  {group}
                </button>
                <div className="hidden group-hover:flex absolute top-8 left-0 z-50 flex-col bg-gray-900 border border-gray-700 rounded-xl shadow-xl min-w-[160px] py-1">
                  {groupLeagues.map((l) => (
                    <a
                      key={l.id}
                      href={`?date=${date}&league=${l.id}`}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-800 transition-colors ${leagueFilter === l.id ? "text-blue-400" : "text-gray-300"}`}
                    >
                      <img src={l.logo} alt={l.name} className="w-4 h-4" />
                      {l.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {leagueFilter && (
          <a href={`?date=${date}`} className="text-xs text-gray-500 hover:text-gray-300">
            ✕ Clear filter
          </a>
        )}
      </div>

      {error && (
        <div className="card text-red-400 text-sm mb-4">
          Failed to load fixtures: {error}
        </div>
      )}

      {fixtures.length === 0 && !error && (
        <div className="card text-center text-gray-500 py-12">
          No matches today for {leagueFilter ? "this league" : "any league"} 😴
        </div>
      )}

      {/* Fixtures grouped by league */}
      {Object.values(byLeague).map(({ league, fixtures: lf }) => (
        <div key={league.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <img src={league.logo} alt={league.name} className="w-5 h-5" />
            <h2 className="font-semibold text-sm text-gray-300">{league.name}</h2>
          </div>
          {lf.map((f) => (
            <FixtureCard key={f.fixture.id} fixture={f} />
          ))}
        </div>
      ))}
    </div>
  );
}
