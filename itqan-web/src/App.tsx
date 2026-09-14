import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
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
import PracticeSessionPage from '@/pages/PracticeSessionPage';
import PracticeReviewPage from '@/pages/PracticeReviewPage';
import InsightsPage from '@/pages/InsightsPage';
import ProfilePage from '@/pages/ProfilePage';
import VoiceMatchPage from '@/pages/VoiceMatchPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * Routing topology.
 *
 * One canonical URL per destination, grouped by what the learner is trying to
 * do rather than by which module owns the screen:
 *
 *   /                  today — the single recommended next action
 *   /learn/*           sequenced courses (Qaida, Tajweed)
 *   /practice/*        open practice, focused review, articulation
 *   /insights          what has actually happened
 *   /profile/*         identity and the optional voice-match
 *   /reference/*       look-up material, entered from a lesson and returned from
 *
 * Older paths still resolve, but as redirects rather than duplicate routes, so
 * back-navigation and the active-nav state stay unambiguous.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />

            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/qaida" element={<QaidaPage />} />
            <Route path="learn/qaida/lesson/:lessonId" element={<QaidaLessonPage />} />
            <Route path="learn/tajweed" element={<TajweedCourseHubPage />} />
            <Route path="learn/tajweed/lesson/:chapterId" element={<TajweedLessonPage />} />

            <Route path="practice" element={<PracticePage />} />
            <Route path="practice/session" element={<PracticeSessionPage />} />
            <Route path="practice/review" element={<PracticeReviewPage />} />
            <Route path="practice/articulation" element={<MakhaarijExplorerPage />} />

            <Route path="insights" element={<InsightsPage />} />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/voice-match" element={<VoiceMatchPage />} />

            <Route path="reference/tajweed" element={<TajweedInfoPage />} />

            {/* Legacy paths — kept as redirects so existing links and bookmarks
                land on the canonical route instead of a second copy of it. */}
            <Route path="qaida" element={<Navigate to="/learn/qaida" replace />} />
            <Route path="qaida/lesson/:lessonId" element={<LegacyQaidaLesson />} />
            <Route path="qaida/makharij" element={<Navigate to="/practice/articulation" replace />} />
            <Route path="learn/qaida/makharij" element={<Navigate to="/practice/articulation" replace />} />
            <Route path="tajweed" element={<Navigate to="/learn/tajweed" replace />} />
            <Route path="tajweed/lesson/:chapterId" element={<LegacyTajweedLesson />} />
            <Route path="learn/tajweed/reference" element={<Navigate to="/reference/tajweed" replace />} />
            <Route path="practice/tajweed" element={<LegacyPracticeSession />} />
            <Route path="practice/voice-match" element={<Navigate to="/profile/voice-match" replace />} />
            <Route path="progress" element={<Navigate to="/insights" replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LegacyQaidaLesson() {
  const { lessonId } = useParams();
  return <Navigate to={`/learn/qaida/lesson/${lessonId}`} replace />;
}

function LegacyTajweedLesson() {
  const { chapterId } = useParams();
  return <Navigate to={`/learn/tajweed/lesson/${chapterId}`} replace />;
}

/** The old studio URL carried its target in the query string — keep it. */
function LegacyPracticeSession() {
  const { search } = useLocation();
  return <Navigate to={`/practice/session${search}`} replace />;
}
