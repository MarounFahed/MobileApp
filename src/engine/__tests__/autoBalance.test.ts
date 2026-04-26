import {
  autoBalance,
  describeBalance,
  expandRoles,
  maxInvestigationsPerNight,
  shuffle,
  MIN_PLAYERS,
} from '../autoBalance';

describe('autoBalance', () => {
  it('throws below the minimum player count', () => {
    expect(() => autoBalance(MIN_PLAYERS - 1)).toThrow();
  });

  it('matches the spec table for 5..14 players', () => {
    const expected: Record<number, [number, number, number, number]> = {
      5: [1, 0, 1, 3],
      6: [1, 1, 1, 3],
      7: [1, 1, 1, 4],
      8: [1, 2, 1, 4],
      9: [1, 2, 1, 5],
      10: [1, 3, 1, 5],
      11: [1, 3, 1, 6],
      12: [1, 4, 1, 6],
      13: [1, 4, 1, 7],
      14: [1, 5, 1, 7],
    };
    Object.entries(expected).forEach(([n, [g, m, i, f]]) => {
      const r = autoBalance(parseInt(n, 10));
      expect([r.godfather, r.mafia, r.investigator, r.filler]).toEqual([
        g,
        m,
        i,
        f,
      ]);
    });
  });

  it('extends past 14 with +1 mafia per 2 extra and +1 filler per extra', () => {
    expect(autoBalance(15)).toEqual({
      godfather: 1,
      mafia: 5,
      investigator: 1,
      filler: 8,
    });
    expect(autoBalance(16)).toEqual({
      godfather: 1,
      mafia: 6,
      investigator: 1,
      filler: 8,
    });
    expect(autoBalance(17)).toEqual({
      godfather: 1,
      mafia: 6,
      investigator: 1,
      filler: 9,
    });
    expect(autoBalance(20)).toEqual({
      godfather: 1,
      mafia: 8,
      investigator: 1,
      filler: 10,
    });
  });

  it('preserves total = playerCount for any size', () => {
    for (let n = 5; n <= 30; n++) {
      const c = autoBalance(n);
      expect(c.godfather + c.mafia + c.investigator + c.filler).toBe(n);
    }
  });

  it('caps investigations per night to 1 below 15 players', () => {
    expect(maxInvestigationsPerNight(5)).toBe(1);
    expect(maxInvestigationsPerNight(14)).toBe(1);
    expect(maxInvestigationsPerNight(15)).toBe(3);
  });
});

describe('expandRoles', () => {
  it('produces lebnene roles', () => {
    const roles = expandRoles('lebnene', autoBalance(7));
    expect(roles).toContain('godfather');
    expect(roles).toContain('mafia');
    expect(roles).toContain('sheriff');
    expect(roles).toContain('police');
    expect(roles.length).toBe(7);
  });

  it('produces standard roles', () => {
    const roles = expandRoles('standard', autoBalance(7));
    expect(roles).toContain('godfather');
    expect(roles).toContain('mafia');
    expect(roles).toContain('detective');
    expect(roles).toContain('civilian');
  });
});

describe('shuffle', () => {
  it('produces deterministic results with a seeded RNG', () => {
    const arr = [1, 2, 3, 4, 5];
    let i = 0;
    const seq = [0.1, 0.7, 0.2, 0.9, 0.4];
    const rng = () => seq[i++ % seq.length]!;
    const a = shuffle(arr, rng);
    i = 0;
    const b = shuffle(arr, rng);
    expect(a).toEqual(b);
  });

  it('does not mutate input', () => {
    const arr = [1, 2, 3];
    shuffle(arr, () => 0.5);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('describeBalance', () => {
  it('sums mafia and town', () => {
    const d = describeBalance(autoBalance(8));
    expect(d.totalMafia).toBe(3); // 1 godfather + 2 mafia
    expect(d.totalTown).toBe(5); // 1 sheriff + 4 police
    expect(d.total).toBe(8);
  });
});
