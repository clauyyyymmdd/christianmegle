import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserRole } from '../../../lib/types';
import { usePriestIdentity } from './usePriestIdentity';
import { usePriestApproval } from './usePriestApproval';
import { useMatchmaking } from './useMatchmaking';

export type Phase =
  | 'loading'
  | 'welcome-back'
  | 'quiz'
  | 'not-saved'
  | 'applied'
  | 'still-a-sinner'
  | 'waiting'
  | 'connected'
  | 'ended';

export function useConfessionalFlow(apiUrl: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = (searchParams.get('role') as UserRole) || 'sinner';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [phase, setPhase] = useState<Phase>('loading');

  const { priestId, priestName, savePriest, clearPriest } = usePriestIdentity();
  const { check, startPolling } = usePriestApproval(apiUrl);
  const { waitingPosition, isInitiator, signalingRef, connect, disconnect } = useMatchmaking(apiUrl);

  const connectToMatchmaker = (currentRole: UserRole, pId?: string) => {
    setPhase('waiting');
    connect(currentRole, pId, () => setPhase('connected'));
  };

  const checkPriestStatus = async (id: string) => {
    try {
      const data = await check(id);
      if (data.status === 'approved') {
        if (data.displayName) savePriest(id, data.displayName);
        setPhase('welcome-back');
      } else if (data.status === 'pending') {
        if (data.displayName) savePriest(id, data.displayName);
        setPhase('applied');
        startPolling(
          id,
          (displayName) => {
            if (displayName) savePriest(id, displayName);
            setPhase('welcome-back');
          },
          () => {
            clearPriest();
            setPhase('still-a-sinner');
          }
        );
      } else {
        clearPriest();
        setPhase('quiz');
      }
    } catch {
      setPhase('quiz');
    }
  };

  useEffect(() => {
    if (initialRole === 'priest') {
      if (priestId) {
        checkPriestStatus(priestId);
      } else {
        setPhase('quiz');
      }
    } else {
      connectToMatchmaker(initialRole);
    }
    return () => disconnect();
  }, []);

  const handleQuizComplete = (id: string, passed: boolean) => {
    if (passed) {
      savePriest(id);
      setPhase('applied');
      checkPriestStatus(id);
    } else {
      setPhase('still-a-sinner');
    }
  };

  const handleBecomeSinner = () => {
    setRole('sinner');
    setSearchParams({ role: 'sinner' });
    connectToMatchmaker('sinner');
  };

  const handleNotSaved = () => setPhase('not-saved');

  const handleStartOver = () => {
    clearPriest();
    setPhase('quiz');
  };

  const handleSessionEnd = () => setPhase('ended');

  const handleRejoin = () => connectToMatchmaker(role, priestId || undefined);

  const handleEnterConfessional = () => connectToMatchmaker(role, priestId || undefined);

  return {
    role,
    phase,
    priestId,
    priestName,
    waitingPosition,
    isInitiator,
    signalingRef,
    navigate,
    handleQuizComplete,
    handleBecomeSinner,
    handleNotSaved,
    handleStartOver,
    handleSessionEnd,
    handleRejoin,
    handleEnterConfessional,
  };
}
