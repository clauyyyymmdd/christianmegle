import LoadingScreen from '../../components/LoadingScreen';
import VideoChat from '../session/VideoChat';
import { useConfessionalFlow } from './hooks/useConfessionalFlow';
import { WelcomeBackScreen } from './screens/WelcomeBackScreen';
import { PriestQuizScreen } from './screens/PriestQuizScreen';
import { PendingApprovalScreen } from './screens/PendingApprovalScreen';
import { WaitingRoom } from './screens/WaitingRoom';
import { SessionEndedScreen } from './screens/SessionEndedScreen';
import { StillASinnerScreen } from './screens/StillASinnerScreen';
import { NotSavedScreen } from './screens/NotSavedScreen';

interface Props {
  apiUrl: string;
}

export default function ConfessionalRoute({ apiUrl }: Props) {
  const {
    role,
    phase,
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
  } = useConfessionalFlow(apiUrl);

  switch (phase) {
    case 'loading':
      return <LoadingScreen />;
    case 'welcome-back':
      return (
        <WelcomeBackScreen
          priestName={priestName}
          onEnter={handleEnterConfessional}
          onStartOver={handleStartOver}
        />
      );
    case 'quiz':
      return (
        <PriestQuizScreen
          apiUrl={apiUrl}
          onComplete={handleQuizComplete}
          onNotSaved={handleNotSaved}
        />
      );
    case 'not-saved':
      return <NotSavedScreen onBecomeSinner={handleBecomeSinner} />;
    case 'applied':
      return <PendingApprovalScreen onStartOver={handleStartOver} />;
    case 'still-a-sinner':
      return <StillASinnerScreen onBecomeSinner={handleBecomeSinner} />;
    case 'waiting':
      return (
        <WaitingRoom
          role={role}
          waitingPosition={waitingPosition}
          onLeave={() => navigate('/')}
          onStartOver={handleStartOver}
        />
      );
    case 'connected':
      if (!signalingRef.current) return null;
      return (
        <VideoChat
          signaling={signalingRef.current}
          role={role}
          isInitiator={isInitiator}
          onSessionEnd={handleSessionEnd}
        />
      );
    case 'ended':
      return (
        <SessionEndedScreen
          role={role}
          onRejoin={handleRejoin}
          onHome={() => navigate('/')}
        />
      );
    default:
      return null;
  }
}
