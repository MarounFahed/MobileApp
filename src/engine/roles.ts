export type GameMode = 'standard' | 'lebnene';

export type Role =
  | 'godfather'
  | 'mafia'
  | 'sheriff'
  | 'police'
  | 'detective'
  | 'civilian';

export type Faction = 'mafia' | 'town';

export const FACTION: Record<Role, Faction> = {
  godfather: 'mafia',
  mafia: 'mafia',
  sheriff: 'town',
  police: 'town',
  detective: 'town',
  civilian: 'town',
};

export function isMafia(role: Role): boolean {
  return FACTION[role] === 'mafia';
}

export function isTown(role: Role): boolean {
  return FACTION[role] === 'town';
}

export function rolesForMode(mode: GameMode): {
  mafiaSide: Role[];
  townSide: Role[];
  investigator: Role;
  filler: Role;
} {
  if (mode === 'lebnene') {
    return {
      mafiaSide: ['godfather', 'mafia'],
      townSide: ['sheriff', 'police'],
      investigator: 'sheriff',
      filler: 'police',
    };
  }
  return {
    mafiaSide: ['godfather', 'mafia'],
    townSide: ['detective', 'civilian'],
    investigator: 'detective',
    filler: 'civilian',
  };
}
