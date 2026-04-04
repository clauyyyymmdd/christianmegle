import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Confessional from './pages/Confessional';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import Whitepaper from './pages/Whitepaper';
import Offering from './pages/Offering';
import Careers from './pages/Careers';
import Footer from './components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/confess" element={<Confessional apiUrl={API_URL} />} />
        <Route path="/admin" element={<Admin apiUrl={API_URL} />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/offering" element={<Offering />} />
        <Route path="/careers" element={<Careers />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
