/**
 * Local ID generator. Used for roster entries, game snapshots, and file names —
 * none of these are compared with external systems, so RFC4122 UUIDs aren't
 * required. Avoids the React Native + uuid + crypto.getRandomValues pitfall.
 */
export function newId(): string {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
