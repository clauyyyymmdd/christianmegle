import { useCallback } from 'react';

export function usePriestApproval(apiUrl: string) {
  const check = useCallback(
    async (id: string): Promise<{ status: string; displayName?: string }> => {
      const res = await fetch(`${apiUrl}/api/priest/${id}`);
      return res.json();
    },
    [apiUrl]
  );

  const startPolling = useCallback(
    (
      id: string,
      onApproved: (displayName?: string) => void,
      onRejected: () => void
    ): (() => void) => {
      const interval = setInterval(async () => {
        try {
          const data = await check(id);
          if (data.status === 'approved') {
            clearInterval(interval);
            onApproved(data.displayName);
          } else if (data.status === 'rejected') {
            clearInterval(interval);
            onRejected();
          }
        } catch {
          // swallow polling errors
        }
      }, 10000);
      return () => clearInterval(interval);
    },
    [check]
  );

  return { check, startPolling };
}
