import { useState } from 'react';

const PRIEST_ID_KEY = 'christianmegle_priest_id';
const PRIEST_NAME_KEY = 'christianmegle_priest_name';

export function usePriestIdentity() {
  const [priestId, setPriestId] = useState<string | null>(
    () => localStorage.getItem(PRIEST_ID_KEY)
  );
  const [priestName, setPriestName] = useState<string | null>(
    () => localStorage.getItem(PRIEST_NAME_KEY)
  );

  const savePriest = (id: string, name?: string) => {
    localStorage.setItem(PRIEST_ID_KEY, id);
    setPriestId(id);
    if (name) {
      localStorage.setItem(PRIEST_NAME_KEY, name);
      setPriestName(name);
    }
  };

  const clearPriest = () => {
    localStorage.removeItem(PRIEST_ID_KEY);
    localStorage.removeItem(PRIEST_NAME_KEY);
    setPriestId(null);
    setPriestName(null);
  };

  return { priestId, priestName, savePriest, clearPriest };
}
