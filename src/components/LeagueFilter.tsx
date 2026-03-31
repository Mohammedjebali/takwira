"use client";

import { useState, useRef, useEffect } from "react";

interface League {
  id: number;
  name: string;
  logo: string;
  group: string;
}

export default function LeagueFilter({
  leagues,
  leagueFilter,
  date,
}: {
  leagues: League[];
  leagueFilter: number | null;
  date: string;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const groups = Array.from(new Set(leagues.map((l) => l.group)));

  return (
    <div className="mb-6" ref={ref}>
      <div className="flex gap-2 flex-wrap items-center">
        <a
          href={`?date=${date}`}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${!leagueFilter ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
        >
          🌍 All
        </a>

        {groups.map((group) => {
          const groupLeagues = leagues.filter((l) => l.group === group);
          const isActive = groupLeagues.some((l) => l.id === leagueFilter);
          const isOpen = openGroup === group;

          return (
            <div key={group} className="relative">
              <button
                onClick={() => setOpenGroup(isOpen ? null : group)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors font-medium ${isActive ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                {group} {isOpen ? "▲" : "▼"}
              </button>

              {isOpen && (
                <div className="absolute top-9 left-0 z-50 flex flex-col bg-gray-900 border border-gray-700 rounded-xl shadow-xl min-w-[180px] py-1">
                  {groupLeagues.map((l) => (
                    <a
                      key={l.id}
                      href={`?date=${date}&league=${l.id}`}
                      onClick={() => setOpenGroup(null)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-800 transition-colors ${leagueFilter === l.id ? "text-blue-400 font-semibold" : "text-gray-300"}`}
                    >
                      <img src={l.logo} alt={l.name} className="w-4 h-4" />
                      {l.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leagueFilter && (
        <a href={`?date=${date}`} className="text-xs text-gray-500 hover:text-gray-300 mt-2 inline-block">
          ✕ Clear filter
        </a>
      )}
    </div>
  );
}
