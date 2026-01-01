import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import QueuePage from "./pages/QueuePage";
import VideoPage from "./pages/VideoPage";
import ExitPage from "./pages/ExitPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/queue" element={<QueuePage />} />
      <Route path="/video" element={<VideoPage />} />
      <Route path="/exit" element={<ExitPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
