import { useMemo } from 'react';
import { renderProfile, renderConfig } from '../borders';
import type { BorderConfig } from '../engine';

export function useLaceBorder(profileOrConfig: string | BorderConfig): string {
  return useMemo(() => {
    if (typeof profileOrConfig === 'string') {
      return renderProfile(profileOrConfig);
    }
    return renderConfig(profileOrConfig);
  }, [profileOrConfig]);
}
