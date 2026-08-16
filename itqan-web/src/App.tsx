import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/authContext';
import { AppShell } from '@/components/AppShell';
import HomePage from '@/pages/HomePage';
import LearnPage from '@/pages/LearnPage';
import QaidaPage from '@/pages/QaidaPage';
import QaidaLessonPage from '@/pages/QaidaLessonPage';
import MakhaarijExplorerPage from '@/pages/MakhaarijExplorerPage';
import TajweedCourseHubPage from '@/pages/TajweedCourseHubPage';
import TajweedLessonPage from '@/pages/TajweedLessonPage';
import TajweedInfoPage from '@/pages/TajweedInfoPage';
import PracticePage from '@/pages/PracticePage';
import ProgressPage from '@/pages/ProgressPage';
import ProfilePage from '@/pages/ProfilePage';
import TajweedStudioPage from '@/pages/TajweedStudioPage';
import VoiceMatchPage from '@/pages/VoiceMatchPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />

            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/qaida" element={<QaidaPage />} />
            <Route path="qaida" element={<QaidaPage />} />
            <Route path="qaida/makharij" element={<MakhaarijExplorerPage />} />
            <Route path="learn/qaida/makharij" element={<MakhaarijExplorerPage />} />
            <Route path="qaida/lesson/:lessonId" element={<QaidaLessonPage />} />
            <Route path="learn/qaida/lesson/:lessonId" element={<QaidaLessonPage />} />

            <Route path="learn/tajweed" element={<TajweedCourseHubPage />} />
            <Route path="learn/tajweed/lesson/:chapterId" element={<TajweedLessonPage />} />
            <Route path="learn/tajweed/reference" element={<TajweedInfoPage />} />
            <Route path="tajweed" element={<TajweedCourseHubPage />} />

            <Route path="practice" element={<PracticePage />} />
            <Route path="practice/tajweed" element={<TajweedStudioPage />} />
            <Route path="practice/voice-match" element={<VoiceMatchPage />} />

            <Route path="progress" element={<ProgressPage />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
