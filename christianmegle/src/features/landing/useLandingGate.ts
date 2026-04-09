import { useState } from 'react';

/**
 * Owns the cross-cutting gating state for the landing page:
 *   - entry splash visibility (sessionStorage-backed)
 *   - light-mode toggle (body classList)
 *   - light-mode eligibility check (pardoned via localStorage)
 *   - the "must be pardoned" denial modal visibility
 *
 * This hook is the only place that touches sessionStorage, localStorage,
 * or document.body.classList for the landing page. Logo / copy / layout
 * components import nothing from here except the values they actually use.
 */
export function useLandingGate() {
  const [showEntry, setShowEntry] = useState(
    () => typeof window !== 'undefined' && !sessionStorage.getItem('christianmegle_entered'),
  );

  const [lightMode, setLightMode] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('light-mode'),
  );

  const [showLightDenied, setShowLightDenied] = useState(false);

  const dismissEntry = () => {
    sessionStorage.setItem('christianmegle_entered', '1');
    setShowEntry(false);
  };

  const toggleLightMode = () => {
    const pardoned = localStorage.getItem('christianmegle_pardoned') === 'true';
    if (!pardoned) {
      setShowLightDenied(true);
      return;
    }
    const next = !lightMode;
    document.body.classList.toggle('light-mode', next);
    setLightMode(next);
  };

  const dismissLightDenied = () => setShowLightDenied(false);

  return {
    showEntry,
    dismissEntry,
    lightMode,
    toggleLightMode,
    showLightDenied,
    dismissLightDenied,
  };
}
