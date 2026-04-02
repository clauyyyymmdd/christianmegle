export interface Priest {
  id: string;
  display_name: string;
  email?: string;
  quiz_score: number;
  quiz_total: number;
  created_at: string;
}

function authHeaders(secret: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  };
}

export async function fetchPriests(
  apiUrl: string,
  filter: 'pending' | 'approved' | 'rejected',
  secret: string
): Promise<{ priests: Priest[]; authenticated: boolean }> {
  const res = await fetch(`${apiUrl}/api/admin/priests?status=${filter}`, {
    headers: authHeaders(secret),
  });
  if (res.status === 401) {
    return { priests: [], authenticated: false };
  }
  const priests = await res.json();
  return { priests, authenticated: true };
}

export async function updatePriestStatus(
  apiUrl: string,
  priestId: string,
  action: 'approve' | 'reject',
  secret: string
): Promise<void> {
  await fetch(`${apiUrl}/api/admin/priests/${priestId}/${action}`, {
    method: 'POST',
    headers: authHeaders(secret),
    body: JSON.stringify({}),
  });
}
