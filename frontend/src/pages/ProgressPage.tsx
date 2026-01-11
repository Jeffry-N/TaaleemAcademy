import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { fetchEnrollments, fetchCourses, fetchLessons, fetchLessonCompletions, fetchQuizzes, fetchQuizAttempts } from '../api/taaleem';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, BookOpen } from 'lucide-react';

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full rounded bg-gray-200">
    <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const ProgressPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: enrollments, isLoading, error } = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollments });
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: lessons } = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons });
  const { data: completions } = useQuery({ queryKey: ['lessonCompletions'], queryFn: fetchLessonCompletions });
  const { data: quizzes } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
  const { data: attempts } = useQuery({ queryKey: ['attempts'], queryFn: fetchQuizAttempts });

  const items = useMemo(() => {
    if (!user || !enrollments || !lessons || !completions) {
      return [];
    }
    
    const userCompletions = new Set(
      completions.filter(c => String(c.userId) === String(user.userId)).map(c => c.lessonId)
    );
    
    return enrollments
      .filter(e => String(e.userId) === String(user.userId))
      .map(e => {
        const courseLessons = lessons.filter(l => l.courseId === e.courseId).sort((a, b) => a.orderIndex - b.orderIndex);
        const courseQuizzes = quizzes?.filter(q => q.courseId === e.courseId) ?? [];
        const completed = courseLessons.filter(l => userCompletions.has(l.id)).length;
        const total = courseLessons.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          ...e,
          courseTitle: courses?.find(c => c.id === e.courseId)?.title ?? `Course #${e.courseId}`,
          completionPercentage: progress,
          courseLessons,
          courseQuizzes,
          userCompletions,
          userAttempts: attempts?.filter(a => a.userId === user.userId) ?? [],
        };
      });
  }, [enrollments, courses, lessons, completions, quizzes, attempts, user]);

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load progress'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">My Progress</h1>
        {!items.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No enrollments yet.</div>
        ) : (
          <div className="space-y-6">
            {items.map((e) => (
              <div key={e.id} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{e.courseTitle}</div>
                      <div className="text-sm text-gray-500">Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">{Math.round(e.completionPercentage)}%</div>
                  </div>
                  <div className="mt-2"><ProgressBar value={e.completionPercentage}/></div>
                </div>

                {e.courseLessons.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Lessons & Quizzes</p>
                    <div className="space-y-2">
                      {e.courseLessons.map((lesson) => {
                        const isComplete = e.userCompletions.has(lesson.id);
                        const lessonQuiz = e.courseQuizzes.find(q => q.lessonId === lesson.id);
                        const quizPassed = lessonQuiz ? e.userAttempts.some(a => a.quizId === lessonQuiz.id && a.isPassed) : false;
                        
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 text-sm">
                            <div className="flex flex-1 items-center gap-2">
                              <div className={`flex h-5 w-5 items-center justify-center rounded ${isComplete ? 'bg-green-100 text-green-700' : 'border border-gray-300 bg-white'}`}>
                                {isComplete && <CheckCircle className="h-4 w-4" />}
                              </div>
                              <span className={isComplete ? 'text-gray-900 font-medium' : 'text-gray-700'}>{lesson.title}</span>
                            </div>
                            {lessonQuiz && (
                              <button
                                onClick={() => nav(`/quiz/${lessonQuiz.id}/take`)}
                                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                                  quizPassed
                                    ? 'bg-green-50 text-green-700'
                                    : isComplete
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : 'cursor-not-allowed bg-gray-50 text-gray-500'
                                }`}
                                disabled={!isComplete}
                              >
                                <BookOpen className="h-3 w-3" />
                                <span>{quizPassed ? 'Passed' : 'Quiz'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
