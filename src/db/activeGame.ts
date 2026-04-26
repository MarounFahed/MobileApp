import { db } from './schema';
import { GameSnapshot } from '@/engine/stateMachine';

export function saveActiveGame(snapshot: GameSnapshot): void {
  db().runSync(
    `INSERT OR REPLACE INTO active_game (id, snapshot_json, saved_at) VALUES (1, ?, ?)`,
    [JSON.stringify(snapshot), Date.now()],
  );
}

export function loadActiveGame(): GameSnapshot | null {
  const r = db().getFirstSync<{ snapshot_json: string }>(
    'SELECT snapshot_json FROM active_game WHERE id = 1',
  );
  if (!r) return null;
  return JSON.parse(r.snapshot_json) as GameSnapshot;
}

export function clearActiveGame(): void {
  db().runSync('DELETE FROM active_game WHERE id = 1');
}
