import {
  narrationKeys,
  night0Sequence,
  nightSequenceLebnene,
  nightSequenceStandard,
} from '../narration';

describe('narrationKeys', () => {
  it('returns three fallback layers ordered most-specific first', () => {
    const keys = narrationKeys({
      phase: 'night_intro',
      mode: 'lebnene',
      playMode: 'no_moderator',
    });
    expect(keys).toEqual([
      'narration.lebnene.no_moderator.night_intro',
      'narration.no_moderator.night_intro',
      'narration.common.night_intro',
    ]);
  });
});

describe('night0Sequence', () => {
  it('omits sheriff investigation in lebnene', () => {
    const lines = night0Sequence('lebnene', 'moderator');
    const phases = lines
      .map((l) => l.keys[0]!.split('.').pop())
      .filter(Boolean);
    expect(phases).not.toContain('night_0_sheriff_open');
  });

  it('includes detective Night 0 reveal in standard', () => {
    const lines = night0Sequence('standard', 'moderator');
    const phases = lines.map((l) => l.keys[0]!.split('.').pop());
    expect(phases).toContain('night_0_sheriff_open');
  });
});

describe('nightSequenceLebnene', () => {
  it('uses pass-phone phrasing in no-moderator mode', () => {
    const lines = nightSequenceLebnene('no_moderator');
    expect(
      lines.some((l) =>
        l.keys[0]!.endsWith('night_sheriff_pass_phone'),
      ),
    ).toBe(true);
  });

  it('does NOT include a mafia kill prompt', () => {
    const lines = nightSequenceLebnene('moderator');
    expect(
      lines.some((l) =>
        l.keys[0]!.endsWith('night_mafia_kill_prompt'),
      ),
    ).toBe(false);
  });
});

describe('nightSequenceStandard', () => {
  it('includes a mafia kill prompt', () => {
    const lines = nightSequenceStandard('moderator');
    expect(
      lines.some((l) =>
        l.keys[0]!.endsWith('night_mafia_kill_prompt'),
      ),
    ).toBe(true);
  });
});
