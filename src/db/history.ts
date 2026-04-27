import { db } from './schema';
import { GameSnapshot } from '@/engine/stateMachine';
import { MvpAward } from '@/engine/mvp';

export interface GameHistoryRow {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: string;
  playMode: string;
  winner: 'mafia' | 'town' | null;
  snapshot: GameSnapshot;
  mvps: MvpAward[];
}

export function saveGame(snapshot: GameSnapshot, mvps: MvpAward[]): void {
  db().runSync(
    `INSERT OR REPLACE INTO games (id, started_at, ended_at, mode, play_mode, winner, settings_json, snapshot_json, mvps_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshot.id,
      snapshot.startedAt,
      snapshot.endedAt ?? null,
      snapshot.settings.mode,
      snapshot.settings.playMode,
      snapshot.win?.winner ?? null,
      JSON.stringify(snapshot.settings),
      JSON.stringify(snapshot),
      JSON.stringify(mvps),
    ],
  );
}

export function listGames(limit = 50): GameHistoryRow[] {
  const rows = db().getAllSync<{
    id: string;
    started_at: number;
    ended_at: number | null;
    mode: string;
    play_mode: string;
    winner: string | null;
    snapshot_json: string;
    mvps_json: string | null;
  }>(
    'SELECT * FROM games ORDER BY started_at DESC LIMIT ?',
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    mode: r.mode,
    playMode: r.play_mode,
    winner: (r.winner as 'mafia' | 'town' | null) ?? null,
    snapshot: JSON.parse(r.snapshot_json) as GameSnapshot,
    mvps: r.mvps_json ? (JSON.parse(r.mvps_json) as MvpAward[]) : [],
  }));
}

export function getGame(id: string): GameHistoryRow | null {
  const r = db().getFirstSync<{
    id: string;
    started_at: number;
    ended_at: number | null;
    mode: string;
    play_mode: string;
    winner: string | null;
    snapshot_json: string;
    mvps_json: string | null;
  }>('SELECT * FROM games WHERE id = ?', [id]);
  if (!r) return null;
  return {
    id: r.id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    mode: r.mode,
    playMode: r.play_mode,
    winner: (r.winner as 'mafia' | 'town' | null) ?? null,
    snapshot: JSON.parse(r.snapshot_json) as GameSnapshot,
    mvps: r.mvps_json ? (JSON.parse(r.mvps_json) as MvpAward[]) : [],
  };
}
