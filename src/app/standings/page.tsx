import { getStandings, getTopLeagues } from "@/lib/api-football";

export const revalidate = 3600; // 1 hour

const SEASON = new Date().getFullYear();
const TOP_LEAGUES = [39, 140, 135, 78, 61, 2];

interface Standing {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  form: string;
}

export default async function StandingsPage() {
  const leagues = await getTopLeagues();
  const leagueMap = Object.fromEntries(leagues.map((l) => [l.id, l]));

  const results = await Promise.allSettled(
    TOP_LEAGUES.map((id) => getStandings(id, SEASON))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Standings {SEASON}</h1>
      {results.map((result, i) => {
        const leagueId = TOP_LEAGUES[i];
        const meta = leagueMap[leagueId];
        if (result.status === "rejected") return null;
        const data = result.value;
        if (!data?.[0]?.league?.standings?.[0]) return null;
        const standings: Standing[] = data[0].league.standings[0];

        return (
          <div key={leagueId} className="card mb-8">
            <div className="flex items-center gap-2 mb-4">
              {meta && <img src={meta.logo} alt={meta.name} className="w-5 h-5" />}
              <h2 className="font-semibold">{meta?.name || `League ${leagueId}`}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left pb-2 w-8">#</th>
                    <th className="text-left pb-2">Team</th>
                    <th className="text-center pb-2 w-10">P</th>
                    <th className="text-center pb-2 w-10">W</th>
                    <th className="text-center pb-2 w-10">D</th>
                    <th className="text-center pb-2 w-10">L</th>
                    <th className="text-center pb-2 w-12">GD</th>
                    <th className="text-center pb-2 w-10">Pts</th>
                    <th className="text-left pb-2 pl-2">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.rank} className="border-b border-gray-900 hover:bg-gray-900/30">
                      <td className="py-1.5 text-gray-500 text-xs">{row.rank}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <img src={row.team.logo} alt={row.team.name} className="w-5 h-5" />
                          <span>{row.team.name}</span>
                        </div>
                      </td>
                      <td className="text-center text-gray-400">{row.all.played}</td>
                      <td className="text-center text-green-500">{row.all.win}</td>
                      <td className="text-center text-yellow-500">{row.all.draw}</td>
                      <td className="text-center text-red-500">{row.all.lose}</td>
                      <td className="text-center text-gray-300">{row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}</td>
                      <td className="text-center font-bold">{row.points}</td>
                      <td className="pl-2">
                        <div className="flex gap-0.5">
                          {row.form?.split("").slice(-5).map((r, j) => (
                            <span
                              key={j}
                              className={`w-4 h-4 rounded-sm text-xs flex items-center justify-center font-bold
                                ${r === "W" ? "bg-green-700 text-green-200" : r === "D" ? "bg-yellow-700 text-yellow-200" : "bg-red-800 text-red-200"}`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
