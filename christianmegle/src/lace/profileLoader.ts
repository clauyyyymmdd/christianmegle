import { generateBorder, type BorderConfig } from './engine';

/**
 * Loader for ChristianMegle Lace Studio JSON profiles.
 *
 * Consumes the exported JSON structure from `christianmegle-lace-studio.html`
 * directly. The canonical shape has `_format: "christianmegle-lace-v1"` with
 * a top-level `ascii` string baked in at export time — this loader uses that
 * field as-is when present.
 *
 * Older exports (`_format: "sacred-lace-border-v1"`) carry their generation
 * parameters in `current` but no pre-rendered `ascii`. For those, the loader
 * falls back to the in-tree `generateBorder()` engine using the same param
 * shape, so the app renders today without needing a re-export.
 *
 * Results are cached by profile name so repeated mounts never refetch.
 */

const cache = new Map<string, Promise<string>>();

export function loadLaceProfile(name: string): Promise<string> {
  const existing = cache.get(name);
  if (existing) return existing;

  const promise = fetch(`/lace/${name}.json`, { cache: 'force-cache' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`lace profile "${name}": HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => parseProfile(name, text))
    .catch((err) => {
      console.warn(`[lace] failed to load profile "${name}"`, err);
      return '';
    });

  cache.set(name, promise);
  return promise;
}

interface LaceProfileJson {
  _format?: string;
  /** christianmegle-lace-v1: pre-rendered ASCII baked in at export time. */
  ascii?: string;
  /** sacred-lace-border-v1: generation parameters in this nested object. */
  current?: Partial<BorderConfig> & Record<string, unknown>;
}

function parseProfile(name: string, text: string): string {
  let data: LaceProfileJson | null = null;

  // Primary path: standard JSON.parse. Works for all christianmegle-lace-v1
  // and all well-formed sacred-lace-border-v1 exports.
  try {
    data = JSON.parse(text) as LaceProfileJson;
  } catch {
    // Tolerant fallback: if the file was truncated mid-`allProfiles` (as
    // waiting-room.json currently is), pull just the `current` object out
    // with a non-greedy brace match and parse that. Keeps the loader
    // resilient to partial exports without silently swallowing real errors.
    const match = text.match(/"current"\s*:\s*(\{[\s\S]*?\n\s*\})\s*,?/);
    if (match) {
      try {
        const current = JSON.parse(match[1]);
        data = { current };
      } catch (err) {
        console.warn(`[lace] salvage parse failed for "${name}"`, err);
      }
    }
  }

  if (!data) return '';

  // ── Path 1: baked ascii (christianmegle-lace-v1) ────────────────
  if (typeof data.ascii === 'string' && data.ascii.length > 0) {
    return data.ascii;
  }

  // ── Path 2: generate from parameters (sacred-lace-border-v1) ────
  if (data.current && typeof data.current === 'object') {
    try {
      return generateBorder(data.current as BorderConfig);
    } catch (err) {
      console.warn(`[lace] generateBorder failed for "${name}"`, err);
      return '';
    }
  }

  return '';
}

/** Test helper: drop cached entries so a profile can be re-fetched. */
export function clearLaceProfileCache(): void {
  cache.clear();
}
