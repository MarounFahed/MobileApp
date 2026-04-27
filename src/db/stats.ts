import { db } from './schema';
import { GameSnapshot } from '@/engine/stateMachine';
import { MvpAward } from '@/engine/mvp';
import { Role } from '@/engine/roles';

export interface RosterStats {
  rosterId: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  mvp: { sheriff: number; mafia: number; civilian: number; bluffer: number };
  rolesPlayed: Record<Role, number>;
}

const ROLE_COL: Record<Role, string> = {
  godfather: 'role_godfather',
  mafia: 'role_mafia',
  sheriff: 'role_sheriff',
  police: 'role_police',
  detective: 'role_detective',
  civilian: 'role_civilian',
};

export function applyGameToStats(
  snapshot: GameSnapshot,
  mvps: MvpAward[],
): void {
  const winner = snapshot.win?.winner;
  const mvpsByPlayer = new Map<string, MvpAward[]>();
  mvps.forEach((m) => {
    const arr = mvpsByPlayer.get(m.playerId) ?? [];
    arr.push(m);
    mvpsByPlayer.set(m.playerId, arr);
  });

  snapshot.players.forEach((p) => {
    // Player id maps directly to roster id when chosen from roster.
    // If player was added ad-hoc (not from roster), id won't be in roster table — skip stats.
    const exists = db().getFirstSync<{ roster_id: string }>(
      'SELECT roster_id FROM roster_stats WHERE roster_id = ?',
      [p.id],
    );
    if (!exists) return;

    const wonThisGame =
      (winner === 'mafia' &&
        (p.role === 'godfather' || p.role === 'mafia')) ||
      (winner === 'town' &&
        (p.role === 'sheriff' ||
          p.role === 'police' ||
          p.role === 'detective' ||
          p.role === 'civilian'));

    const playerMvps = mvpsByPlayer.get(p.id) ?? [];
    const mvpInc = {
      sheriff: 0,
      mafia: 0,
      civilian: 0,
      bluffer: 0,
    };
    playerMvps.forEach((m) => {
      if (m.category === 'best_sheriff') mvpInc.sheriff++;
      if (m.category === 'best_mafia') mvpInc.mafia++;
      if (m.category === 'best_civilian') mvpInc.civilian++;
      if (m.category === 'best_bluffer') mvpInc.bluffer++;
    });

    db().runSync(
      `UPDATE roster_stats SET
        games_played = games_played + 1,
        games_won = games_won + ?,
        mvp_sheriff = mvp_sheriff + ?,
        mvp_mafia = mvp_mafia + ?,
        mvp_civilian = mvp_civilian + ?,
        mvp_bluffer = mvp_bluffer + ?,
        ${ROLE_COL[p.role]} = ${ROLE_COL[p.role]} + 1
       WHERE roster_id = ?`,
      [
        wonThisGame ? 1 : 0,
        mvpInc.sheriff,
        mvpInc.mafia,
        mvpInc.civilian,
        mvpInc.bluffer,
        p.id,
      ],
    );
  });
}

export function getStats(rosterId: string): RosterStats | null {
  const r = db().getFirstSync<{
    roster_id: string;
    games_played: number;
    games_won: number;
    mvp_sheriff: number;
    mvp_mafia: number;
    mvp_civilian: number;
    mvp_bluffer: number;
    role_godfather: number;
    role_mafia: number;
    role_sheriff: number;
    role_police: number;
    role_detective: number;
    role_civilian: number;
  }>('SELECT * FROM roster_stats WHERE roster_id = ?', [rosterId]);
  if (!r) return null;
  return {
    rosterId: r.roster_id,
    gamesPlayed: r.games_played,
    gamesWon: r.games_won,
    winRate: r.games_played > 0 ? r.games_won / r.games_played : 0,
    mvp: {
      sheriff: r.mvp_sheriff,
      mafia: r.mvp_mafia,
      civilian: r.mvp_civilian,
      bluffer: r.mvp_bluffer,
    },
    rolesPlayed: {
      godfather: r.role_godfather,
      mafia: r.role_mafia,
      sheriff: r.role_sheriff,
      police: r.role_police,
      detective: r.role_detective,
      civilian: r.role_civilian,
    },
  };
}
