export interface LeaderboardRow {
  display_name: string;
  pardons: number;
}

export async function fetchLeaderboard(apiUrl: string): Promise<LeaderboardRow[]> {
  const res = await fetch(`${apiUrl}/api/leaderboard`);
  return res.json();
}
