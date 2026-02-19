import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/workouts/Workouts';
import Nutrition from './pages/nutrition/Nutrition';
import Recovery from './pages/recovery/Recovery';
import Settings from './pages/settings/Settings';
import Leaderboard from './pages/leaderboard/Leaderboard';
import Community from './pages/community/Community';
import AICoachPage from './pages/AICoach';
import Wellness from './pages/Wellness';
import Insights from './pages/Insights';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-coach" element={<AICoachPage />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/community" element={<Community />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" theme="dark" />
      </AuthProvider>
    </Router>
  );
}

export default App;
