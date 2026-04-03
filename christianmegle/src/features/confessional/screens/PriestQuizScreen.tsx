import BibleQuiz from '../../../components/BibleQuiz';

interface Props {
  apiUrl: string;
  onComplete: (id: string, passed: boolean) => void;
  onNotSaved: () => void;
}

export function PriestQuizScreen({ apiUrl, onComplete, onNotSaved }: Props) {
  return <BibleQuiz apiUrl={apiUrl} onComplete={onComplete} onNotSaved={onNotSaved} />;
}
