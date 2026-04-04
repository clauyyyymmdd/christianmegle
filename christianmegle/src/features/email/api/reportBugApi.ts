export async function reportBug(
  apiUrl: string,
  description: string,
  url?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${apiUrl}/api/report-bug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, url }),
  });
  return res.json();
}
