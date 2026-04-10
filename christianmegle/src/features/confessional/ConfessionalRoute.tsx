import LoadingScreen from './screens/LoadingScreen';
import VideoChat from '../session/SessionShell';
import { useConfessionalFlow } from './hooks/useConfessionalFlow';
import { WelcomeBackScreen } from './screens/WelcomeBackScreen';
import { PriestQuizScreen } from './screens/PriestQuizScreen';
import { WaitingRoom } from './screens/WaitingRoom';
import { SessionEndedScreen } from './screens/SessionEndedScreen';
import { StillASinnerScreen } from './screens/StillASinnerScreen';
import { NotSavedScreen } from './screens/NotSavedScreen';

interface Props {
  apiUrl: string;
}

export default function ConfessionalRoute({ apiUrl }: Props) {
  const {
    state,
    priestName,
    signalingRef,
    navigate,
    handleQuizComplete,
    handleBecomeSinner,
    handleNotSaved,
    handleStartOver,
    handleSessionEnd,
    handleExcommunicate,
    handleSwitchPartner,
    handleRejoin,
    handleEnterConfessional,
    handleBoot,
    screenshotDataUrl,
    captureScreenshot,
  } = useConfessionalFlow(apiUrl);

  // Exhaustive switch on the discriminated union — TypeScript will error
  // if a new state kind is added to machine.ts without handling it here.
  switch (state.kind) {
    case 'loading':
      return <LoadingScreen onComplete={handleBoot} />;

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
      return null;

    case 'still-a-sinner':
      return <StillASinnerScreen onBecomeSinner={handleBecomeSinner} />;

    case 'waiting':
      return (
        <WaitingRoom
          role={state.role}
          waitingPosition={state.position}
          onLeave={() => navigate('/')}
          onStartOver={handleStartOver}
        />
      );

    case 'connected':
      if (!signalingRef.current) return null;
      return (
        <VideoChat
          signaling={signalingRef.current}
          role={state.role}
          isInitiator={state.isInitiator}
          apiUrl={apiUrl}
          onSessionEnd={handleSessionEnd}
          onExcommunicate={handleExcommunicate}
          onSwitchPartner={handleSwitchPartner}
          onScreenshot={captureScreenshot}
        />
      );

    case 'ended':
      return (
        <SessionEndedScreen
          role={state.role}
          onRejoin={handleRejoin}
          onHome={() => navigate('/')}
          screenshotDataUrl={screenshotDataUrl}
        />
      );
  }
}
