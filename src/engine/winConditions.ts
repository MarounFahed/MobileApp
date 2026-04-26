import { Role, isMafia, isTown } from './roles';

export interface PlayerSlim {
  alive: boolean;
  role: Role;
}

export type Winner = 'mafia' | 'town' | null;

export interface WinResult {
  winner: Winner;
  reason:
    | 'godfather_eliminated'
    | 'all_mafia_eliminated'
    | 'mafia_parity'
    | 'ongoing';
}

export function evaluateWin(players: PlayerSlim[]): WinResult {
  const aliveMafia = players.filter((p) => p.alive && isMafia(p.role));
  const aliveTown = players.filter((p) => p.alive && isTown(p.role));
  const godfatherAlive = players.some(
    (p) => p.alive && p.role === 'godfather',
  );

  if (!godfatherAlive) {
    return { winner: 'town', reason: 'godfather_eliminated' };
  }
  if (aliveMafia.length === 0) {
    return { winner: 'town', reason: 'all_mafia_eliminated' };
  }
  if (aliveMafia.length >= aliveTown.length) {
    return { winner: 'mafia', reason: 'mafia_parity' };
  }
  return { winner: null, reason: 'ongoing' };
}
