import { computeMvps } from '../mvp';
import { GameSnapshot, GameSettings } from '../stateMachine';

const settings: GameSettings = {
  mode: 'lebnene',
  playMode: 'moderator',
  discussionTimerSec: 180,
  nightPace: 'medium',
  investigationsPerNight: 1,
  tieBreak: 'revote',
  godfatherInnocentToDetective: true,
  soundEnabled: true,
  musicEnabled: true,
  deathSpeechSec: 30,
};

const baseSnapshot = (
  overrides: Partial<GameSnapshot> = {},
): GameSnapshot => ({
  id: 'g1',
  state: 'END',
  round: 4,
  startedAt: 0,
  endedAt: 1,
  settings,
  players: [],
  investigations: [],
  votes: [],
  mafiaKills: [],
  ...overrides,
});

describe('computeMvps', () => {
  it('awards Best Sheriff for accuracy', () => {
    const snap = baseSnapshot({
      players: [
        {
          id: 'p1',
          name: 'A',
          color: '#fff',
          role: 'godfather',
          alive: false,
          seat: 0,
          roundsSurvived: 2,
        },
        {
          id: 'p3',
          name: 'C',
          color: '#fff',
          role: 'sheriff',
          alive: true,
          seat: 1,
          roundsSurvived: 4,
        },
      ],
      investigations: [
        { round: 1, sheriffId: 'p3', targetId: 'p1', result: 'mafia', correct: true },
        { round: 2, sheriffId: 'p3', targetId: 'p1', result: 'mafia', correct: true },
        { round: 3, sheriffId: 'p3', targetId: 'p1', result: 'town', correct: false },
      ],
      win: { winner: 'town', reason: 'godfather_eliminated' },
    });
    const awards = computeMvps(snap);
    const sheriff = awards.find((a) => a.category === 'best_sheriff');
    expect(sheriff?.playerId).toBe('p3');
    expect(sheriff?.score).toBeCloseTo(2 / 3);
  });

  it('awards Best Mafia only on a mafia win and weights godfather +50%', () => {
    const snap = baseSnapshot({
      players: [
        {
          id: 'p1',
          name: 'GF',
          color: '#fff',
          role: 'godfather',
          alive: true,
          seat: 0,
          roundsSurvived: 4,
        },
        {
          id: 'p2',
          name: 'M',
          color: '#fff',
          role: 'mafia',
          alive: true,
          seat: 1,
          roundsSurvived: 4,
        },
      ],
      win: { winner: 'mafia', reason: 'mafia_parity' },
    });
    const awards = computeMvps(snap);
    const mafia = awards.find((a) => a.category === 'best_mafia');
    expect(mafia?.playerId).toBe('p1'); // godfather wins on bonus
  });

  it('does not award Best Mafia on town win', () => {
    const snap = baseSnapshot({
      players: [
        {
          id: 'p1',
          name: 'GF',
          color: '#fff',
          role: 'godfather',
          alive: false,
          seat: 0,
          roundsSurvived: 2,
        },
      ],
      win: { winner: 'town', reason: 'godfather_eliminated' },
    });
    const awards = computeMvps(snap);
    expect(awards.find((a) => a.category === 'best_mafia')).toBeUndefined();
  });

  it('awards Best Bluffer to longest-surviving never-voted-out mafia', () => {
    const snap = baseSnapshot({
      players: [
        {
          id: 'p1',
          name: 'GF',
          color: '#fff',
          role: 'godfather',
          alive: false,
          seat: 0,
          roundsSurvived: 2,
        },
        {
          id: 'p2',
          name: 'M',
          color: '#fff',
          role: 'mafia',
          alive: true,
          seat: 1,
          roundsSurvived: 4,
        },
      ],
      votes: [
        { round: 2, eliminatedId: 'p1', tieBreakUsed: false },
      ],
    });
    const awards = computeMvps(snap);
    const bluffer = awards.find((a) => a.category === 'best_bluffer');
    expect(bluffer?.playerId).toBe('p2');
  });
});
