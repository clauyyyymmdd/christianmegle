export interface PriestStatus {
  status: 'approved' | 'pending' | 'rejected';
  displayName?: string;
}

export async function checkPriestStatus(apiUrl: string, priestId: string): Promise<PriestStatus> {
  const res = await fetch(`${apiUrl}/api/priest/${priestId}`);
  return res.json();
}
