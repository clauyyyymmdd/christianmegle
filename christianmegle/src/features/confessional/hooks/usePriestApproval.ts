import { useCallback } from 'react';
import { checkPriestStatus, type PriestStatus } from '../../priest-onboarding/api/priestApi';

export function usePriestApproval(apiUrl: string) {
  const check = useCallback(
    async (id: string): Promise<PriestStatus> => {
      return checkPriestStatus(apiUrl, id);
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
