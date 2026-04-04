export function sanitizeString(input: unknown, maxLength: number): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

export function isValidPriestId(id: string): boolean {
  return /^[a-f0-9-]{8,36}$/.test(id);
}
