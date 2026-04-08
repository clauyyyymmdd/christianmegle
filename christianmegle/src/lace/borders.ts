import { generateBorder, type BorderConfig } from './engine';
import profilesData from './profiles.json';

interface ProfileFile {
  _format: string;
  allProfiles: BorderConfig[];
}

const PROFILES: Map<string, BorderConfig> = new Map(
  (profilesData as ProfileFile).allProfiles.map((p) => [p.name!, p]),
);

export function getProfile(name: string): BorderConfig | undefined {
  return PROFILES.get(name);
}

export function listProfiles(): string[] {
  return Array.from(PROFILES.keys());
}

export function renderProfile(name: string): string {
  const profile = PROFILES.get(name);
  if (!profile) {
    throw new Error(`Unknown lace profile: ${name}`);
  }
  return generateBorder(profile);
}

export function renderConfig(config: BorderConfig): string {
  return generateBorder(config);
}
