import { create } from 'zustand';
import {
  GameSnapshot,
  startRoleReveal,
  finishRoleReveal,
  finishNight0,
  startVote,
  recordVoteElimination,
  finishDeathSpeech,
  finishRoleRevealOnDeath,
  checkWinAndAdvance,
  startNight,
  recordMafiaKill,
  recordInvestigation,
  finishNight,
} from '@/engine/stateMachine';
import {
  saveActiveGame,
  loadActiveGame,
  clearActiveGame,
} from '@/db/activeGame';
import { saveGame } from '@/db/history';
import { applyGameToStats } from '@/db/stats';
import { computeMvps, MvpAward } from '@/engine/mvp';

interface GameState {
  snapshot: GameSnapshot | null;
  mvps: MvpAward[];
  setSnapshot: (s: GameSnapshot | null) => void;
  /** Apply a transition function and persist. */
  apply: (fn: (s: GameSnapshot) => GameSnapshot) => void;
  hydrateFromActive: () => boolean;
  clear: () => void;

  // Convenience wrappers
  startRoleReveal: () => void;
  finishRoleReveal: () => void;
  finishNight0: () => void;
  startVote: () => void;
  recordVoteElimination: (id: string | null, tieBreakUsed?: boolean) => void;
  finishDeathSpeech: () => void;
  finishRoleRevealOnDeath: () => void;
  checkWinAndAdvance: () => void;
  startNight: () => void;
  recordMafiaKill: (targetId: string | null) => void;
  recordInvestigation: (sheriffId: string, targetId: string) => void;
  finishNight: () => void;

  finalize: () => MvpAward[];
}

export const useGameStore = create<GameState>((set, get) => ({
  snapshot: null,
  mvps: [],

  setSnapshot: (s) => {
    set({ snapshot: s });
    if (s) saveActiveGame(s);
  },

  apply: (fn) => {
    const s = get().snapshot;
    if (!s) return;
    const next = fn(s);
    set({ snapshot: next });
    if (next.state === 'END') {
      clearActiveGame();
    } else {
      saveActiveGame(next);
    }
  },

  hydrateFromActive: () => {
    const s = loadActiveGame();
    if (s) {
      set({ snapshot: s });
      return true;
    }
    return false;
  },

  clear: () => {
    clearActiveGame();
    set({ snapshot: null, mvps: [] });
  },

  startRoleReveal: () => get().apply(startRoleReveal),
  finishRoleReveal: () => get().apply(finishRoleReveal),
  finishNight0: () => get().apply(finishNight0),
  startVote: () => get().apply(startVote),
  recordVoteElimination: (id, tieBreakUsed) =>
    get().apply((s) => recordVoteElimination(s, id, tieBreakUsed)),
  finishDeathSpeech: () => get().apply(finishDeathSpeech),
  finishRoleRevealOnDeath: () => get().apply(finishRoleRevealOnDeath),
  checkWinAndAdvance: () => get().apply(checkWinAndAdvance),
  startNight: () => get().apply(startNight),
  recordMafiaKill: (id) => get().apply((s) => recordMafiaKill(s, id)),
  recordInvestigation: (sid, tid) =>
    get().apply((s) => recordInvestigation(s, sid, tid)),
  finishNight: () => get().apply(finishNight),

  finalize: () => {
    const s = get().snapshot;
    if (!s || s.state !== 'END') return [];
    const mvps = computeMvps(s);
    saveGame(s, mvps);
    applyGameToStats(s, mvps);
    set({ mvps });
    return mvps;
  },
}));
