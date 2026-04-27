import { GameMode, Role, rolesForMode } from './roles';

export interface RoleCounts {
  godfather: number;
  mafia: number;
  investigator: number;
  filler: number;
}

const TABLE: Record<number, RoleCounts> = {
  5: { godfather: 1, mafia: 0, investigator: 1, filler: 3 },
  6: { godfather: 1, mafia: 1, investigator: 1, filler: 3 },
  7: { godfather: 1, mafia: 1, investigator: 1, filler: 4 },
  8: { godfather: 1, mafia: 2, investigator: 1, filler: 4 },
  9: { godfather: 1, mafia: 2, investigator: 1, filler: 5 },
  10: { godfather: 1, mafia: 3, investigator: 1, filler: 5 },
  11: { godfather: 1, mafia: 3, investigator: 1, filler: 6 },
  12: { godfather: 1, mafia: 4, investigator: 1, filler: 6 },
  13: { godfather: 1, mafia: 4, investigator: 1, filler: 7 },
  14: { godfather: 1, mafia: 5, investigator: 1, filler: 7 },
};

export const MIN_PLAYERS = 5;

export function autoBalance(playerCount: number): RoleCounts {
  if (playerCount < MIN_PLAYERS) {
    throw new Error(`Mafiazo requires at least ${MIN_PLAYERS} players`);
  }

  const fixed = TABLE[playerCount];
  if (fixed) {
    return { ...fixed };
  }

  // 15+: +1 mafia every 2 players above 14, +1 filler every player above 14
  const extra = playerCount - 14;
  const mafia14 = TABLE[14]!.mafia;
  const filler14 = TABLE[14]!.filler;
  return {
    godfather: 1,
    mafia: mafia14 + Math.floor(extra / 2),
    investigator: 1,
    filler: filler14 + extra - Math.floor(extra / 2),
  };
}

export interface BalanceResult {
  godfather: number;
  mafia: number;
  investigator: number;
  filler: number;
  totalMafia: number;
  totalTown: number;
  total: number;
}

export function describeBalance(counts: RoleCounts): BalanceResult {
  const totalMafia = counts.godfather + counts.mafia;
  const totalTown = counts.investigator + counts.filler;
  return {
    ...counts,
    totalMafia,
    totalTown,
    total: totalMafia + totalTown,
  };
}

export function maxInvestigationsPerNight(playerCount: number): 1 | 2 | 3 {
  if (playerCount >= 15) {
    return 3;
  }
  return 1;
}

export function expandRoles(
  mode: GameMode,
  counts: RoleCounts,
): Role[] {
  const map = rolesForMode(mode);
  const out: Role[] = [];
  for (let i = 0; i < counts.godfather; i++) out.push('godfather');
  for (let i = 0; i < counts.mafia; i++) out.push('mafia');
  for (let i = 0; i < counts.investigator; i++) out.push(map.investigator);
  for (let i = 0; i < counts.filler; i++) out.push(map.filler);
  return out;
}

/**
 * Fisher-Yates shuffle. Accepts an injectable RNG so tests are deterministic.
 */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
