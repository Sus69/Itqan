import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import HomePage from '@/pages/HomePage';
import LearnPage from '@/pages/LearnPage';
import QaidaPage from '@/pages/QaidaPage';
import PracticePage from '@/pages/PracticePage';
import ProgressPage from '@/pages/ProgressPage';
import ProfilePage from '@/pages/ProfilePage';
import TajweedStudioPage from '@/pages/TajweedStudioPage';
import VoiceMatchPage from '@/pages/VoiceMatchPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />

          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/qaida" element={<QaidaPage />} />

          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/tajweed" element={<TajweedStudioPage />} />
          <Route path="practice/voice-match" element={<VoiceMatchPage />} />

          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
