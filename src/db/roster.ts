import { db } from './schema';

export interface RosterEntry {
  id: string;
  name: string;
  photoUri?: string;
  color: string;
  createdAt: number;
}

const COLORS = [
  '#C43E3E',
  '#2E7D4F',
  '#3E7DC4',
  '#C49E3E',
  '#7D3EC4',
  '#3EC4B0',
  '#C43E91',
  '#3EC470',
];

export function pickColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

export function listRoster(): RosterEntry[] {
  const rows = db().getAllSync<{
    id: string;
    name: string;
    photo_uri: string | null;
    color: string;
    created_at: number;
  }>('SELECT * FROM roster ORDER BY name COLLATE NOCASE');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    photoUri: r.photo_uri ?? undefined,
    color: r.color,
    createdAt: r.created_at,
  }));
}

export function addRoster(entry: RosterEntry): void {
  db().runSync(
    'INSERT INTO roster (id, name, photo_uri, color, created_at) VALUES (?, ?, ?, ?, ?)',
    [entry.id, entry.name, entry.photoUri ?? null, entry.color, entry.createdAt],
  );
  db().runSync('INSERT OR IGNORE INTO roster_stats (roster_id) VALUES (?)', [
    entry.id,
  ]);
}

export function updateRoster(entry: RosterEntry): void {
  db().runSync(
    'UPDATE roster SET name = ?, photo_uri = ?, color = ? WHERE id = ?',
    [entry.name, entry.photoUri ?? null, entry.color, entry.id],
  );
}

export function removeRoster(id: string): void {
  db().runSync('DELETE FROM roster WHERE id = ?', [id]);
}
