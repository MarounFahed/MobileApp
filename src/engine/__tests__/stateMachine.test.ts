import {
  createGame,
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
  alivePlayers,
  findInvestigator,
  GameSettings,
} from '../stateMachine';
import { autoBalance } from '../autoBalance';

const baseSettings = (
  overrides: Partial<GameSettings> = {},
): GameSettings => ({
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
  ...overrides,
});

const makePlayers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    color: '#ccc',
  }));

describe('createGame', () => {
  it('rejects fewer than 5 players', () => {
    expect(() =>
      createGame({
        id: 'g1',
        settings: baseSettings(),
        players: makePlayers(4),
        counts: { godfather: 1, mafia: 0, investigator: 1, filler: 2 },
      }),
    ).toThrow();
  });

  it('rejects mismatched role counts', () => {
    expect(() =>
      createGame({
        id: 'g1',
        settings: baseSettings(),
        players: makePlayers(7),
        counts: { godfather: 1, mafia: 1, investigator: 1, filler: 2 }, // sums to 5, not 7
      }),
    ).toThrow();
  });

  it('rejects investigationsPerNight > 1 below 15 players', () => {
    expect(() =>
      createGame({
        id: 'g1',
        settings: baseSettings({ investigationsPerNight: 2 }),
        players: makePlayers(7),
        counts: autoBalance(7),
      }),
    ).toThrow();
  });

  it('seats players clockwise (seat 0..N-1)', () => {
    const g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
    });
    g.players.forEach((p, i) => expect(p.seat).toBe(i));
  });

  it('uses manualRoles when provided', () => {
    const g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    expect(g.players[0]!.role).toBe('godfather');
    expect(g.players[2]!.role).toBe('sheriff');
  });
});

describe('full Lebnene 7-player flow', () => {
  it('walks through reveal → night 0 → day → vote → death speech → check win → night → ...', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });

    g = startRoleReveal(g);
    expect(g.state).toBe('ROLE_REVEAL');

    g = finishRoleReveal(g);
    expect(g.state).toBe('NIGHT_0');

    g = finishNight0(g);
    expect(g.state).toBe('DAY');
    expect(g.round).toBe(1);

    g = startVote(g);
    expect(g.state).toBe('VOTE');

    // Eliminate one of the police players (p4).
    g = recordVoteElimination(g, 'p4');
    expect(g.state).toBe('DEATH_SPEECH');

    g = finishDeathSpeech(g);
    expect(g.state).toBe('ROLE_REVEAL_ON_DEATH');
    expect(g.players.find((p) => p.id === 'p4')!.alive).toBe(false);

    g = finishRoleRevealOnDeath(g);
    expect(g.state).toBe('CHECK_WIN');

    g = checkWinAndAdvance(g);
    expect(g.state).toBe('NIGHT');

    g = startNight(g);
    // Lebnene: no mafia kill, jump straight to investigate.
    expect(g.state).toBe('NIGHT_INVESTIGATE');

    g = recordInvestigation(g, 'p3', 'p1'); // Sheriff investigates Godfather
    expect(g.investigations.length).toBe(1);
    expect(g.investigations[0]!.result).toBe('mafia');
    expect(g.investigations[0]!.correct).toBe(true);

    g = finishNight(g);
    expect(g.state).toBe('DAY');
    expect(g.round).toBe(2);
  });

  it('skips elimination on tie when configured', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings({ tieBreak: 'skip' }),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));
    g = startVote(g);
    g = recordVoteElimination(g, null, true);
    expect(g.state).toBe('CHECK_WIN');
    expect(g.votes[0]!.tieBreakUsed).toBe(true);
    expect(alivePlayers(g).length).toBe(7);
  });

  it('triggers town win when godfather is voted out', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));
    g = startVote(g);
    g = recordVoteElimination(g, 'p1');
    g = finishRoleRevealOnDeath(finishDeathSpeech(g));
    g = checkWinAndAdvance(g);
    expect(g.state).toBe('END');
    expect(g.win?.winner).toBe('town');
    expect(g.win?.reason).toBe('godfather_eliminated');
  });

  it('triggers mafia win at parity', () => {
    // 5-player setup: godfather + sheriff + 3 police.
    let g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(5),
      counts: autoBalance(5),
      manualRoles: ['godfather', 'sheriff', 'police', 'police', 'police'],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));

    // Vote out one police: 4 alive, 1 mafia + 3 town. No win.
    g = startVote(g);
    g = recordVoteElimination(g, 'p3');
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    expect(g.state).toBe('NIGHT');

    // Vote another police: 3 alive, 1 mafia + 2 town. No win.
    g = startNight(g);
    g = recordInvestigation(g, 'p2', 'p1');
    g = finishNight(g);
    g = startVote(g);
    g = recordVoteElimination(g, 'p4');
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    expect(g.state).toBe('NIGHT');

    // Vote final police: 2 alive, 1 mafia + 1 town. Parity.
    g = startNight(g);
    g = recordInvestigation(g, 'p2', 'p1');
    g = finishNight(g);
    g = startVote(g);
    g = recordVoteElimination(g, 'p5');
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    expect(g.state).toBe('END');
    expect(g.win?.winner).toBe('mafia');
  });
});

describe('standard mode', () => {
  it('routes night through mafia kill before investigation', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings({ mode: 'standard' }),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'detective',
        'civilian',
        'civilian',
        'civilian',
        'civilian',
      ],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));
    g = startVote(g);
    g = recordVoteElimination(g, 'p4'); // civilian
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    expect(g.state).toBe('NIGHT');
    g = startNight(g);
    expect(g.state).toBe('NIGHT_MAFIA_KILL');
    g = recordMafiaKill(g, 'p5'); // civilian dies overnight
    expect(g.state).toBe('NIGHT_INVESTIGATE');
    g = recordInvestigation(g, 'p3', 'p1'); // detective on godfather
    expect(g.investigations[0]!.result).toBe('town'); // godfather appears innocent
    expect(g.investigations[0]!.correct).toBe(false);
    g = finishNight(g);
    expect(g.state).toBe('DAY');
  });

  it('respects godfatherInnocentToDetective=false', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings({
        mode: 'standard',
        godfatherInnocentToDetective: false,
      }),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'detective',
        'civilian',
        'civilian',
        'civilian',
        'civilian',
      ],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));
    g = startVote(g);
    g = recordVoteElimination(g, 'p4');
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    g = startNight(g);
    g = recordMafiaKill(g, null);
    g = recordInvestigation(g, 'p3', 'p1');
    expect(g.investigations[0]!.result).toBe('mafia');
    expect(g.investigations[0]!.correct).toBe(true);
  });

  it('rejects mafia kill in lebnene mode', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    g = startRoleReveal(g);
    g = finishRoleReveal(g);
    g = finishNight0(g);
    g = startVote(g);
    // Eliminate a police player so the game continues into Night.
    g = recordVoteElimination(g, 'p7');
    g = finishDeathSpeech(g);
    g = finishRoleRevealOnDeath(g);
    g = checkWinAndAdvance(g);
    g = startNight(g);
    expect(g.state).toBe('NIGHT_INVESTIGATE');
    expect(() => recordMafiaKill(g, 'p1')).toThrow();
  });
});

describe('invalid transitions', () => {
  it('rejects vote before day', () => {
    const g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
    });
    expect(() => startVote(g)).toThrow();
  });

  it('rejects investigation by a non-investigator', () => {
    let g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    g = finishNight0(finishRoleReveal(startRoleReveal(g)));
    g = startVote(g);
    g = recordVoteElimination(g, 'p4');
    g = checkWinAndAdvance(finishRoleRevealOnDeath(finishDeathSpeech(g)));
    g = startNight(g);
    expect(() => recordInvestigation(g, 'p1', 'p2')).toThrow();
  });
});

describe('helpers', () => {
  it('findInvestigator returns sheriff in lebnene', () => {
    const g = createGame({
      id: 'g1',
      settings: baseSettings(),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'sheriff',
        'police',
        'police',
        'police',
        'police',
      ],
    });
    expect(findInvestigator(g)?.id).toBe('p3');
  });

  it('findInvestigator returns detective in standard', () => {
    const g = createGame({
      id: 'g1',
      settings: baseSettings({ mode: 'standard' }),
      players: makePlayers(7),
      counts: autoBalance(7),
      manualRoles: [
        'godfather',
        'mafia',
        'detective',
        'civilian',
        'civilian',
        'civilian',
        'civilian',
      ],
    });
    expect(findInvestigator(g)?.id).toBe('p3');
  });
});
