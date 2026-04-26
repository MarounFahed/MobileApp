import { GameSnapshot, Player } from './stateMachine';
import { isMafia, isTown } from './roles';

export type MvpCategory =
  | 'best_sheriff'
  | 'best_mafia'
  | 'best_civilian'
  | 'best_bluffer';

export interface MvpAward {
  category: MvpCategory;
  playerId: string;
  /** Score used to win the award; useful for display. */
  score: number;
  /** Human-readable detail: e.g. "5/6 correct calls". */
  detail: string;
}

export function computeMvps(snapshot: GameSnapshot): MvpAward[] {
  const awards: MvpAward[] = [];

  // Best Sheriff/Detective: highest investigation accuracy.
  const investigations = snapshot.investigations;
  if (investigations.length > 0) {
    const sheriff = snapshot.players.find((p) =>
      snapshot.settings.mode === 'lebnene'
        ? p.role === 'sheriff'
        : p.role === 'detective',
    );
    if (sheriff) {
      const correct = investigations.filter((i) => i.correct).length;
      const accuracy = correct / investigations.length;
      awards.push({
        category: 'best_sheriff',
        playerId: sheriff.id,
        score: accuracy,
        detail: `${correct}/${investigations.length} correct calls`,
      });
    }
  }

  // Best Mafia: only awarded on mafia win, weighted by rounds survived;
  // godfather gets +50% bonus weight.
  if (snapshot.win?.winner === 'mafia') {
    const mafiaPlayers = snapshot.players.filter((p) => isMafia(p.role));
    let best: Player | undefined;
    let bestScore = -1;
    mafiaPlayers.forEach((p) => {
      const weight = p.role === 'godfather' ? 1.5 : 1;
      const score = (p.alive ? p.roundsSurvived + 1 : p.roundsSurvived) * weight;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });
    if (best) {
      awards.push({
        category: 'best_mafia',
        playerId: best.id,
        score: bestScore,
        detail: best.alive
          ? `Survived ${best.roundsSurvived} rounds`
          : `Lasted ${best.roundsSurvived} rounds`,
      });
    }
  }

  // Best Civilian/Police: town player whose votes most often hit actual mafia.
  // We approximate from votes: each round, the eliminated player is known.
  // A town survivor "hits" when an eliminated player is mafia. Not perfect,
  // but a reasonable proxy when individual ballots aren't recorded.
  const townSurvivors = snapshot.players.filter(
    (p) => isTown(p.role) && p.alive,
  );
  if (townSurvivors.length > 0 && snapshot.votes.length > 0) {
    const hits = snapshot.votes.filter((v) => {
      if (!v.eliminatedId) return false;
      const target = snapshot.players.find((p) => p.id === v.eliminatedId);
      return target ? isMafia(target.role) : false;
    }).length;
    // Award the longest-surviving town player as collective representative.
    const sorted = townSurvivors
      .slice()
      .sort((a, b) => b.roundsSurvived - a.roundsSurvived);
    const winner = sorted[0]!;
    awards.push({
      category: 'best_civilian',
      playerId: winner.id,
      score: hits,
      detail: `Town hit ${hits}/${snapshot.votes.length} mafia`,
    });
  }

  // Best Bluffer: mafia who survived longest without being voted out.
  // Defined as a mafia member who was never the target of a successful vote.
  const mafiaPlayers = snapshot.players.filter((p) => isMafia(p.role));
  const votedOutIds = new Set(
    snapshot.votes
      .filter((v) => v.eliminatedId)
      .map((v) => v.eliminatedId as string),
  );
  const bluffCandidates = mafiaPlayers.filter((p) => !votedOutIds.has(p.id));
  if (bluffCandidates.length > 0) {
    const sorted = bluffCandidates
      .slice()
      .sort((a, b) => b.roundsSurvived - a.roundsSurvived);
    const winner = sorted[0]!;
    awards.push({
      category: 'best_bluffer',
      playerId: winner.id,
      score: winner.roundsSurvived,
      detail: `Mafia, never voted out (${winner.roundsSurvived} rounds)`,
    });
  }

  return awards;
}
