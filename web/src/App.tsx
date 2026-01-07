import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import WaitingPage from "./pages/WaitingPage";
import ChatPage from "./pages/ChatPage";
import ExitPage from "./pages/ExitPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/waiting" element={<WaitingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/exit" element={<ExitPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
