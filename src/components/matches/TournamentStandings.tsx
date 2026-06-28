import { useMemo } from 'react';
import { useBetStore } from '../../store/betStore';

export default function TournamentStandings() {
  const matches = useBetStore((s) => s.matches);

  // IPL Standings
  const iplStandings = useMemo(() => {
    const teams = [
      { name: 'Chennai Super Kings', short: 'CSK' },
      { name: 'Mumbai Indians', short: 'MI' },
      { name: 'Royal Challengers Bengaluru', short: 'RCB' },
      { name: 'Kolkata Knight Riders', short: 'KKR' },
      { name: 'Punjab Kings', short: 'PBKS' },
      { name: 'Lucknow Super Giants', short: 'LSG' },
      { name: 'Gujarat Titans', short: 'GT' },
      { name: 'Delhi Capitals', short: 'DC' },
      { name: 'Rajasthan Royals', short: 'RR' },
      { name: 'Sunrisers Hyderabad', short: 'SRH' },
    ];

    const standings = teams.map((t) => ({
      ...t,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      nrr: 0.0,
    }));

    // Filter finished IPL matches
    const iplMatches = matches.filter(
      (m) => m.tournament.toLowerCase().includes('ipl') && m.status === 'finished',
    );

    iplMatches.forEach((m) => {
      const t1 = standings.find((s) => s.short === m.team1.shortName || s.name === m.team1.name);
      const t2 = standings.find((s) => s.short === m.team2.shortName || s.name === m.team2.name);
      if (!t1 || !t2) return;

      t1.played++;
      t2.played++;

      // Check result to find winner
      const res = m.score?.result?.toLowerCase() || '';
      const t1Winner =
        res.includes(m.team1.shortName.toLowerCase()) || res.includes(m.team1.name.toLowerCase());
      const t2Winner =
        res.includes(m.team2.shortName.toLowerCase()) || res.includes(m.team2.name.toLowerCase());

      if (t1Winner) {
        t1.won++;
        t1.points += 2;
        t2.lost++;
      } else if (t2Winner) {
        t2.won++;
        t2.points += 2;
        t1.lost++;
      }
    });

    const mockBase = {
      CSK: { played: 14, won: 9, lost: 5, points: 18, nrr: 0.54 },
      MI: { played: 14, won: 8, lost: 6, points: 16, nrr: 0.21 },
      RCB: { played: 14, won: 8, lost: 6, points: 16, nrr: 0.15 },
      KKR: { played: 14, won: 7, lost: 7, points: 14, nrr: 0.08 },
      RR: { played: 14, won: 7, lost: 7, points: 14, nrr: -0.05 },
      SRH: { played: 14, won: 6, lost: 8, points: 12, nrr: -0.12 },
      LSG: { played: 14, won: 6, lost: 8, points: 12, nrr: -0.18 },
      GT: { played: 14, won: 5, lost: 9, points: 10, nrr: -0.24 },
      DC: { played: 14, won: 5, lost: 9, points: 10, nrr: -0.31 },
      PBKS: { played: 14, won: 4, lost: 10, points: 8, nrr: -0.45 },
    };

    const finalStandings = standings.map((s) => {
      const base = mockBase[s.short as keyof typeof mockBase] || {
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        nrr: 0,
      };
      return {
        ...s,
        played: base.played + s.played,
        won: base.won + s.won,
        lost: base.lost + s.lost,
        points: base.points + s.points,
        nrr: base.nrr + s.nrr,
      };
    });

    return finalStandings.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  }, [matches]);

  // World Cup Standings
  const wcStandings = useMemo(() => {
    const teams = [
      { name: 'India', short: 'IND' },
      { name: 'Australia', short: 'AUS' },
      { name: 'England', short: 'ENG' },
      { name: 'South Africa', short: 'SA' },
      { name: 'Pakistan', short: 'PAK' },
      { name: 'New Zealand', short: 'NZ' },
    ];

    const standings = teams.map((t) => ({
      ...t,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      nrr: 0.0,
    }));

    const wcMatches = matches.filter(
      (m) =>
        (m.tournament.toLowerCase().includes('champions') ||
          m.tournament.toLowerCase().includes('world cup')) &&
        m.status === 'finished',
    );

    wcMatches.forEach((m) => {
      const t1 = standings.find((s) => s.short === m.team1.shortName || s.name === m.team1.name);
      const t2 = standings.find((s) => s.short === m.team2.shortName || s.name === m.team2.name);
      if (!t1 || !t2) return;

      t1.played++;
      t2.played++;

      const res = m.score?.result?.toLowerCase() || '';
      const t1Winner =
        res.includes(m.team1.shortName.toLowerCase()) || res.includes(m.team1.name.toLowerCase());
      const t2Winner =
        res.includes(m.team2.shortName.toLowerCase()) || res.includes(m.team2.name.toLowerCase());

      if (t1Winner) {
        t1.won++;
        t1.points += 2;
        t2.lost++;
      } else if (t2Winner) {
        t2.won++;
        t2.points += 2;
        t1.lost++;
      }
    });

    const mockBase = {
      IND: { played: 5, won: 4, lost: 1, points: 8, nrr: 1.15 },
      AUS: { played: 5, won: 3, lost: 2, points: 6, nrr: 0.45 },
      ENG: { played: 5, won: 3, lost: 2, points: 6, nrr: 0.12 },
      SA: { played: 5, won: 2, lost: 3, points: 4, nrr: -0.22 },
      PAK: { played: 5, won: 2, lost: 3, points: 4, nrr: -0.55 },
      NZ: { played: 5, won: 1, lost: 4, points: 2, nrr: -0.95 },
    };

    const finalStandings = standings.map((s) => {
      const base = mockBase[s.short as keyof typeof mockBase] || {
        played: 0,
        won: 0,
        lost: 0,
        points: 0,
        nrr: 0,
      };
      return {
        ...s,
        played: base.played + s.played,
        won: base.won + s.won,
        lost: base.lost + s.lost,
        points: base.points + s.points,
        nrr: base.nrr + s.nrr,
      };
    });

    return finalStandings.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  }, [matches]);

  // Bilateral Series Tracker
  const bilateralSeries = useMemo(() => {
    const seriesMatches = matches.filter(
      (m) =>
        m.tournament.toLowerCase().includes('series') ||
        m.tournament.toLowerCase().includes('bilateral'),
    );

    const engWins = seriesMatches.filter(
      (m) => m.status === 'finished' && m.score?.result?.includes('England'),
    ).length;
    const saWins = seriesMatches.filter(
      (m) => m.status === 'finished' && m.score?.result?.includes('South Africa'),
    ).length;
    const pending = seriesMatches.filter((m) => m.status !== 'finished').length;

    return [
      {
        name: 'England vs South Africa T20I Series',
        format: 'T20',
        score: `ENG ${engWins} - ${saWins} SA`,
        status: pending > 0 ? `${pending} matches remaining` : 'Series Completed',
        lead:
          engWins > saWins
            ? 'England leads'
            : saWins > engWins
              ? 'South Africa leads'
              : 'Series Tied',
      },
    ];
  }, [matches]);

  return (
    <div className="space-y-6 animate-slide-up" style={{ opacity: 1 }}>
      {/* IPL Standings */}
      <div className="bg-surface card-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-gold uppercase tracking-wider mb-3">IPL 2026 Standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.04] text-[10px] text-dim uppercase font-bold tracking-wider">
                <th className="py-2">Pos</th>
                <th className="py-2">Team</th>
                <th className="py-2 text-center">P</th>
                <th className="py-2 text-center">W</th>
                <th className="py-2 text-center">L</th>
                <th className="py-2 text-center">Pts</th>
                <th className="py-2 text-right">NRR</th>
              </tr>
            </thead>
            <tbody>
              {iplStandings.map((team, idx) => (
                <tr key={team.short} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                  <td className="py-2.5 font-bold text-muted">{idx + 1}</td>
                  <td className="py-2.5 font-semibold text-white/90">
                    <span className="md:hidden">{team.short}</span>
                    <span className="hidden md:inline">{team.name}</span>
                  </td>
                  <td className="py-2.5 text-center text-white/80">{team.played}</td>
                  <td className="py-2.5 text-center text-profit font-semibold">{team.won}</td>
                  <td className="py-2.5 text-center text-loss">{team.lost}</td>
                  <td className="py-2.5 text-center font-bold text-white">{team.points}</td>
                  <td className="py-2.5 text-right font-mono text-[11px] text-dim">
                    {team.nrr >= 0 ? '+' : ''}
                    {team.nrr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* World Cup Standings */}
      <div className="bg-surface card-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-purple uppercase tracking-wider mb-3">Champions Trophy 2026</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.04] text-[10px] text-dim uppercase font-bold tracking-wider">
                <th className="py-2">Pos</th>
                <th className="py-2">Team</th>
                <th className="py-2 text-center">P</th>
                <th className="py-2 text-center">W</th>
                <th className="py-2 text-center">L</th>
                <th className="py-2 text-center">Pts</th>
                <th className="py-2 text-right">NRR</th>
              </tr>
            </thead>
            <tbody>
              {wcStandings.map((team, idx) => (
                <tr key={team.short} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                  <td className="py-2.5 font-bold text-muted">{idx + 1}</td>
                  <td className="py-2.5 font-semibold text-white/90">{team.name}</td>
                  <td className="py-2.5 text-center text-white/80">{team.played}</td>
                  <td className="py-2.5 text-center text-profit font-semibold">{team.won}</td>
                  <td className="py-2.5 text-center text-loss">{team.lost}</td>
                  <td className="py-2.5 text-center font-bold text-white">{team.points}</td>
                  <td className="py-2.5 text-right font-mono text-[11px] text-dim">
                    {team.nrr >= 0 ? '+' : ''}
                    {team.nrr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilateral Series Tracker */}
      <div className="bg-surface card-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-gold uppercase tracking-wider mb-3">Bilateral Series Tracking</h3>
        <div className="space-y-3">
          {bilateralSeries.map((series, idx) => (
            <div key={idx} className="p-3 bg-dark/40 border border-white/[0.03] rounded-lg flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white/95">{series.name}</p>
                <p className="text-[10px] text-dim mt-0.5">
                  {series.status} • {series.format}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{series.score}</p>
                <p className="text-[10px] text-gold font-bold mt-0.5">{series.lead}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
