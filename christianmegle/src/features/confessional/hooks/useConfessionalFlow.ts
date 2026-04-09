import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserRole } from '../../../lib/types';
import { usePriestIdentity } from './usePriestIdentity';
import { usePriestApproval } from './usePriestApproval';
import { useMatchmaking } from './useMatchmaking';
import { transition, initialState, type State, type Event } from '../machine';

export type { State, StateKind } from '../machine';

const reducer = (state: State, event: Event): State => transition(state, event);

export function useConfessionalFlow(apiUrl: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = (searchParams.get('role') as UserRole) || 'sinner';

  const [state, dispatch] = useReducer(reducer, initialRole, initialState);

  // Single-slot screenshot: last-write-wins across switches. Cleared
  // when the user rejoins from the ended screen or starts over.
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const captureScreenshot = useCallback((dataUrl: string) => {
    setScreenshotDataUrl(dataUrl);
  }, []);

  const { priestId, priestName, savePriest, clearPriest } = usePriestIdentity();
  const { check, startPolling } = usePriestApproval(apiUrl);
  const { waitingPosition, signalingRef, connect, disconnect } = useMatchmaking(apiUrl);

  // Sync external matchmaking state into the state machine
  useEffect(() => {
    if (state.kind === 'waiting' && waitingPosition !== state.position) {
      dispatch({ type: 'WAITING', position: waitingPosition });
    }
  }, [waitingPosition, state]);

  // Side effect: kick off matchmaking when entering 'waiting' state
  const lastConnectKey = useRef<string | null>(null);
  useEffect(() => {
    if (state.kind !== 'waiting') {
      lastConnectKey.current = null;
      return;
    }
    const key = `${state.role}:${priestId ?? ''}`;
    if (lastConnectKey.current === key) return;
    lastConnectKey.current = key;

    connect(state.role, priestId || undefined, (initiator) => {
      dispatch({ type: 'MATCHED', isInitiator: initiator });
    });
  }, [state.kind, state.role, priestId]);

  // Side effect: check priest approval status when entering 'applied'
  const lastPollKey = useRef<string | null>(null);
  useEffect(() => {
    if (state.kind !== 'applied' || !priestId) return;
    if (lastPollKey.current === priestId) return;
    lastPollKey.current = priestId;

    let cancelled = false;

    (async () => {
      try {
        const data = await check(priestId);
        if (cancelled) return;
        if (data.status === 'approved') {
          if (data.displayName) savePriest(priestId, data.displayName);
          dispatch({ type: 'PRIEST_APPROVED' });
          return;
        }
        if (data.status === 'pending' && data.displayName) {
          savePriest(priestId, data.displayName);
        }
        // Stay in applied, start polling for approval/rejection
        startPolling(
          priestId,
          (displayName) => {
            if (cancelled) return;
            if (displayName) savePriest(priestId, displayName);
            dispatch({ type: 'PRIEST_APPROVED' });
          },
          () => {
            if (cancelled) return;
            clearPriest();
            dispatch({ type: 'PRIEST_REJECTED' });
          }
        );
      } catch {
        // Network failure during initial check — fall through silently
      }
    })();

    return () => { cancelled = true; };
  }, [state.kind, priestId]);

  // Bootstrap: hold loading for 1200ms, then dispatch the right boot event
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialRole === 'priest') {
        if (priestId) {
          // Returning priest — check status
          check(priestId).then((data) => {
            if (data.status === 'approved') {
              if (data.displayName) savePriest(priestId, data.displayName);
              dispatch({ type: 'BOOT_AS_PRIEST_RETURNING' });
            } else if (data.status === 'pending') {
              if (data.displayName) savePriest(priestId, data.displayName);
              dispatch({ type: 'BOOT_AS_PRIEST_PENDING' });
            } else {
              clearPriest();
              dispatch({ type: 'BOOT_AS_PRIEST_NEW' });
            }
          }).catch(() => {
            dispatch({ type: 'BOOT_AS_PRIEST_NEW' });
          });
        } else {
          dispatch({ type: 'BOOT_AS_PRIEST_NEW' });
        }
      } else {
        dispatch({ type: 'BOOT_AS_SINNER' });
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, []);

  // ── Action dispatchers (called by ConfessionalRoute screens) ──

  const handleQuizComplete = (id: string, passed: boolean) => {
    if (passed) {
      savePriest(id);
      dispatch({ type: 'QUIZ_PASSED' });
    } else {
      dispatch({ type: 'QUIZ_FAILED' });
    }
  };

  const handleNotSaved = () => dispatch({ type: 'QUIZ_NOT_SAVED' });

  const handleBecomeSinner = () => {
    setSearchParams({ role: 'sinner' });
    dispatch({ type: 'BECOME_SINNER' });
  };

  const handleStartOver = () => {
    clearPriest();
    setScreenshotDataUrl(null);
    dispatch({ type: 'START_OVER' });
  };

  const handleEnterConfessional = () => dispatch({ type: 'ENTER_CONFESSIONAL' });

  const handleSessionEnd = () => dispatch({ type: 'SESSION_ENDED' });

  const handleRejoin = () => {
    // Clear the previous session's screenshot so the new journey
    // starts with an empty slot.
    setScreenshotDataUrl(null);
    dispatch({ type: 'REJOIN' });
  };

  const handleExcommunicate = () => dispatch({ type: 'EXCOMMUNICATE' });

  const handleSwitchPartner = () => dispatch({ type: 'SWITCH_PARTNER' });

  return {
    state,
    role: state.role,
    priestId,
    priestName,
    waitingPosition: state.kind === 'waiting' ? state.position : 0,
    isInitiator: state.kind === 'connected' ? state.isInitiator : false,
    signalingRef,
    navigate,
    handleQuizComplete,
    handleNotSaved,
    handleBecomeSinner,
    handleStartOver,
    handleEnterConfessional,
    handleSessionEnd,
    handleRejoin,
    handleExcommunicate,
    handleSwitchPartner,
    screenshotDataUrl,
    captureScreenshot,
  };
}
