import { GameMode, Role } from './roles';
import { evaluateWin, WinResult } from './winConditions';
import { PlayMode } from './narration';
import {
  RoleCounts,
  expandRoles,
  shuffle,
  maxInvestigationsPerNight,
} from './autoBalance';

export type GameState =
  | 'SETUP'
  | 'ROLE_REVEAL'
  | 'NIGHT_0'
  | 'DAY'
  | 'VOTE'
  | 'DEATH_SPEECH'
  | 'ROLE_REVEAL_ON_DEATH'
  | 'CHECK_WIN'
  | 'NIGHT'
  | 'NIGHT_MAFIA_KILL'
  | 'NIGHT_INVESTIGATE'
  | 'END';

export interface Player {
  id: string;
  name: string;
  /** Local file URI; undefined => initials avatar. */
  photoUri?: string;
  /** Auto color used if no photo. */
  color: string;
  role: Role;
  alive: boolean;
  /** Order at the table (clockwise, 0-indexed). */
  seat: number;
  /** When the player died (round number, 0 = setup phase). */
  diedOnRound?: number;
  /** Number of rounds the player survived. */
  roundsSurvived: number;
}

export interface InvestigationLog {
  round: number;
  sheriffId: string;
  targetId: string;
  /** What the sheriff was shown. */
  result: 'mafia' | 'town';
  /** Was the result accurate (i.e. matched target's actual faction)? */
  correct: boolean;
}

export interface VoteLog {
  round: number;
  eliminatedId: string | null;
  tieBreakUsed: boolean;
}

export interface MafiaKillLog {
  round: number;
  targetId: string;
}

export interface GameSettings {
  mode: GameMode;
  playMode: PlayMode;
  discussionTimerSec: number; // 60..600
  nightPace: 'slow' | 'medium' | 'fast';
  investigationsPerNight: 1 | 2 | 3;
  tieBreak: 'revote' | 'skip';
  godfatherInnocentToDetective: boolean; // standard mode only
  soundEnabled: boolean;
  musicEnabled: boolean;
  /** Death speech is fixed per ruleset. Stored for resume integrity. */
  deathSpeechSec: 30;
}

export interface GameSnapshot {
  id: string;
  state: GameState;
  round: number;
  startedAt: number;
  endedAt?: number;
  settings: GameSettings;
  players: Player[];
  investigations: InvestigationLog[];
  votes: VoteLog[];
  mafiaKills: MafiaKillLog[];
  pendingEliminationId?: string;
  win?: WinResult;
}

export interface CreateGameOpts {
  id: string;
  settings: GameSettings;
  players: Omit<Player, 'role' | 'alive' | 'seat' | 'roundsSurvived'>[];
  counts: RoleCounts;
  /** Optional manual role assignment, must match counts. */
  manualRoles?: Role[];
  rng?: () => number;
  now?: number;
}

export function createGame(opts: CreateGameOpts): GameSnapshot {
  const { id, settings, players, counts, manualRoles, rng, now } = opts;

  const total = players.length;
  if (total < 5) {
    throw new Error('Mafiazo requires at least 5 players');
  }
  if (
    counts.godfather + counts.mafia + counts.investigator + counts.filler !==
    total
  ) {
    throw new Error('Role counts must equal the number of players');
  }

  const maxInv = maxInvestigationsPerNight(total);
  if (settings.investigationsPerNight > maxInv) {
    throw new Error(
      `Only ${maxInv} investigation(s) per night allowed at ${total} players`,
    );
  }

  const rolePool: Role[] =
    manualRoles && manualRoles.length === total
      ? manualRoles.slice()
      : shuffle(expandRoles(settings.mode, counts), rng);

  if (rolePool.length !== total) {
    throw new Error('Role pool does not match player count');
  }

  const seated: Player[] = players.map((p, idx) => ({
    ...p,
    seat: idx,
    role: rolePool[idx]!,
    alive: true,
    roundsSurvived: 0,
  }));

  return {
    id,
    state: 'SETUP',
    round: 0,
    startedAt: now ?? Date.now(),
    settings,
    players: seated,
    investigations: [],
    votes: [],
    mafiaKills: [],
  };
}

// ---------- Transitions ----------

type Transition = (s: GameSnapshot, payload?: any) => GameSnapshot;

function clone(s: GameSnapshot): GameSnapshot {
  return {
    ...s,
    settings: { ...s.settings },
    players: s.players.map((p) => ({ ...p })),
    investigations: s.investigations.slice(),
    votes: s.votes.slice(),
    mafiaKills: s.mafiaKills.slice(),
    win: s.win ? { ...s.win } : undefined,
  };
}

export function startRoleReveal(s: GameSnapshot): GameSnapshot {
  expectState(s, ['SETUP']);
  const next = clone(s);
  next.state = 'ROLE_REVEAL';
  return next;
}

export function finishRoleReveal(s: GameSnapshot): GameSnapshot {
  expectState(s, ['ROLE_REVEAL']);
  const next = clone(s);
  next.state = 'NIGHT_0';
  return next;
}

export function finishNight0(s: GameSnapshot): GameSnapshot {
  expectState(s, ['NIGHT_0']);
  const next = clone(s);
  next.state = 'DAY';
  next.round = 1;
  return next;
}

export function startVote(s: GameSnapshot): GameSnapshot {
  expectState(s, ['DAY']);
  const next = clone(s);
  next.state = 'VOTE';
  return next;
}

export function recordVoteElimination(
  s: GameSnapshot,
  eliminatedId: string | null,
  tieBreakUsed = false,
): GameSnapshot {
  expectState(s, ['VOTE']);
  const next = clone(s);
  next.votes.push({
    round: next.round,
    eliminatedId,
    tieBreakUsed,
  });
  if (eliminatedId) {
    next.pendingEliminationId = eliminatedId;
    next.state = 'DEATH_SPEECH';
  } else {
    // skipped or tie with skip rule -> straight to night
    next.state = 'CHECK_WIN';
  }
  return next;
}

export function finishDeathSpeech(s: GameSnapshot): GameSnapshot {
  expectState(s, ['DEATH_SPEECH']);
  const next = clone(s);
  if (next.pendingEliminationId) {
    const target = next.players.find(
      (p) => p.id === next.pendingEliminationId,
    );
    if (target && target.alive) {
      target.alive = false;
      target.diedOnRound = next.round;
      target.roundsSurvived = next.round;
    }
  }
  next.state = 'ROLE_REVEAL_ON_DEATH';
  return next;
}

export function finishRoleRevealOnDeath(s: GameSnapshot): GameSnapshot {
  expectState(s, ['ROLE_REVEAL_ON_DEATH']);
  const next = clone(s);
  next.pendingEliminationId = undefined;
  next.state = 'CHECK_WIN';
  return next;
}

export function checkWinAndAdvance(s: GameSnapshot): GameSnapshot {
  expectState(s, ['CHECK_WIN']);
  const next = clone(s);
  const result = evaluateWin(next.players);
  if (result.winner) {
    next.win = result;
    next.state = 'END';
    next.endedAt = Date.now();
    // Survivors get +1 round survived for the round they won in.
    next.players.forEach((p) => {
      if (p.alive) {
        p.roundsSurvived = next.round;
      }
    });
  } else {
    next.state = 'NIGHT';
  }
  return next;
}

export function startNight(s: GameSnapshot): GameSnapshot {
  expectState(s, ['NIGHT']);
  const next = clone(s);
  if (next.settings.mode === 'standard') {
    next.state = 'NIGHT_MAFIA_KILL';
  } else {
    next.state = 'NIGHT_INVESTIGATE';
  }
  return next;
}

export function recordMafiaKill(
  s: GameSnapshot,
  targetId: string | null,
): GameSnapshot {
  expectState(s, ['NIGHT_MAFIA_KILL']);
  if (s.settings.mode !== 'standard') {
    throw new Error('Mafia nightly kill is only valid in standard mode');
  }
  const next = clone(s);
  if (targetId) {
    const target = next.players.find((p) => p.id === targetId);
    if (!target || !target.alive) {
      throw new Error('Mafia kill target must be an alive player');
    }
    target.alive = false;
    target.diedOnRound = next.round + 1;
    target.roundsSurvived = next.round;
    next.mafiaKills.push({ round: next.round + 1, targetId });
  }
  next.state = 'NIGHT_INVESTIGATE';
  return next;
}

export function recordInvestigation(
  s: GameSnapshot,
  sheriffId: string,
  targetId: string,
): GameSnapshot {
  expectState(s, ['NIGHT_INVESTIGATE']);
  const next = clone(s);
  const sheriff = next.players.find((p) => p.id === sheriffId);
  const target = next.players.find((p) => p.id === targetId);
  if (!sheriff || !target) {
    throw new Error('Sheriff or target not found');
  }
  const investigatorRole =
    next.settings.mode === 'lebnene' ? 'sheriff' : 'detective';
  if (sheriff.role !== investigatorRole) {
    throw new Error('Only the investigator may perform investigations');
  }
  if (!sheriff.alive) {
    throw new Error('Dead investigator cannot investigate');
  }

  // What the investigator sees:
  let result: 'mafia' | 'town';
  if (next.settings.mode === 'standard') {
    if (
      target.role === 'godfather' &&
      next.settings.godfatherInnocentToDetective
    ) {
      result = 'town';
    } else if (target.role === 'mafia') {
      result = 'mafia';
    } else if (target.role === 'godfather') {
      result = 'mafia';
    } else {
      result = 'town';
    }
  } else {
    // Lebnene: sheriff sees true faction (godfather always reads as mafia).
    result = target.role === 'mafia' || target.role === 'godfather'
      ? 'mafia'
      : 'town';
  }

  const trueFaction: 'mafia' | 'town' =
    target.role === 'mafia' || target.role === 'godfather' ? 'mafia' : 'town';

  next.investigations.push({
    round: next.round + 1,
    sheriffId,
    targetId,
    result,
    correct: result === trueFaction,
  });
  return next;
}

export function finishNight(s: GameSnapshot): GameSnapshot {
  expectState(s, ['NIGHT_INVESTIGATE', 'NIGHT_MAFIA_KILL']);
  const next = clone(s);
  // Increment round: the day that follows is the new round.
  next.round += 1;
  // After mafia nightly kill (standard mode), check win before reopening day.
  const result = evaluateWin(next.players);
  if (result.winner) {
    next.win = result;
    next.state = 'END';
    next.endedAt = Date.now();
    next.players.forEach((p) => {
      if (p.alive) {
        p.roundsSurvived = next.round;
      }
    });
  } else {
    next.state = 'DAY';
  }
  return next;
}

// ---------- Helpers ----------

function expectState(s: GameSnapshot, allowed: GameState[]): void {
  if (!allowed.includes(s.state)) {
    throw new Error(
      `Invalid transition from ${s.state}; expected one of ${allowed.join(', ')}`,
    );
  }
}

export function alivePlayers(s: GameSnapshot): Player[] {
  return s.players.filter((p) => p.alive);
}

export function getPlayerInClockwiseOrder(
  s: GameSnapshot,
  seatIndex: number,
): Player | undefined {
  return s.players.find((p) => p.seat === seatIndex);
}

export function findInvestigator(s: GameSnapshot): Player | undefined {
  const role: Role = s.settings.mode === 'lebnene' ? 'sheriff' : 'detective';
  return s.players.find((p) => p.role === role);
}
