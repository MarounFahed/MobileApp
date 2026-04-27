import { evaluateWin, PlayerSlim } from '../winConditions';

const p = (role: PlayerSlim['role'], alive = true): PlayerSlim => ({
  role,
  alive,
});

describe('evaluateWin', () => {
  it('town wins when godfather eliminated', () => {
    const players: PlayerSlim[] = [
      p('godfather', false),
      p('mafia'),
      p('police'),
      p('police'),
      p('sheriff'),
    ];
    expect(evaluateWin(players).winner).toBe('town');
    expect(evaluateWin(players).reason).toBe('godfather_eliminated');
  });

  it('town wins when all mafia eliminated', () => {
    const players: PlayerSlim[] = [
      p('godfather'),
      p('mafia', false),
      p('police'),
      p('police'),
    ];
    // Godfather is alive, but is he the only mafia? godfather is mafia faction.
    // If all *mafia faction* dead, town wins.
    const allDead: PlayerSlim[] = [
      p('godfather', false),
      p('mafia', false),
      p('police'),
      p('police'),
    ];
    expect(evaluateWin(allDead).winner).toBe('town');
    // godfather alive should not yet trigger town win:
    expect(evaluateWin(players).winner).toBe(null);
  });

  it('mafia wins at parity', () => {
    const players: PlayerSlim[] = [
      p('godfather'),
      p('mafia'),
      p('police'),
      p('police', false),
    ];
    expect(evaluateWin(players).winner).toBe('mafia');
    expect(evaluateWin(players).reason).toBe('mafia_parity');
  });

  it('mafia wins when outnumbering town', () => {
    const players: PlayerSlim[] = [
      p('godfather'),
      p('mafia'),
      p('police', false),
    ];
    expect(evaluateWin(players).winner).toBe('mafia');
  });

  it('returns ongoing when neither condition met', () => {
    const players: PlayerSlim[] = [
      p('godfather'),
      p('mafia'),
      p('police'),
      p('police'),
      p('sheriff'),
    ];
    expect(evaluateWin(players).winner).toBe(null);
  });

  it('treats godfather as mafia for parity counting', () => {
    // 1 godfather (mafia faction), 1 town -> mafia wins.
    const players: PlayerSlim[] = [p('godfather'), p('police')];
    expect(evaluateWin(players).winner).toBe('mafia');
  });
});
