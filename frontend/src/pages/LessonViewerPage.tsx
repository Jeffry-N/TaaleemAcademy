import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CheckCircle, FileText, MessageSquare, X, BookOpen, Lock } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { fetchLessons, fetchCourseById, markLessonComplete, fetchQuizzes, fetchLessonCompletions, fetchQuizAttempts } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';

export const LessonViewerPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = parseInt(searchParams.get('courseId') || '0', 10);
  const lessonId = parseInt(searchParams.get('lessonId') || '0', 10);

  const [currentLessonId, setCurrentLessonId] = useState(lessonId || 0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseById(courseId),
    enabled: courseId > 0,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  });

  const { data: quizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: fetchQuizzes,
  });

  const { data: completions } = useQuery({
    queryKey: ['lessonCompletions'],
    queryFn: fetchLessonCompletions,
  });

  const { data: attempts } = useQuery({
    queryKey: ['attempts'],
    queryFn: fetchQuizAttempts,
  });

  const markCompleteMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Not logged in');
      return markLessonComplete(currentLessonId, user.userId);
    },
  });

  const courseLessons = lessons?.filter((l) => l.courseId === courseId).sort((a, b) => a.orderIndex - b.orderIndex) ?? [];
  const isLessonComplete = user ? completions?.some((c) => c.lessonId === currentLessonId && c.userId === user.userId) : false;
  const linkedQuiz = quizzes?.find((q) => q.lessonId === currentLessonId);

  // Check if lesson is locked (not first lesson, and previous lesson not completed or quiz not passed)
  const canAccessLesson = (lessonId: number): boolean => {
    const idx = courseLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return true; // First lesson always accessible
    
    const prevLesson = courseLessons[idx - 1];
    const isPrevComplete = completions?.some((c) => c.lessonId === prevLesson.id && c.userId === user?.userId);
    
    if (!isPrevComplete) return false;
    
    const prevQuiz = quizzes?.find((q) => q.lessonId === prevLesson.id);
    if (prevQuiz) {
      const isPrevQuizPassed = attempts?.some((a) => a.quizId === prevQuiz.id && a.userId === user?.userId && a.isPassed);
      return !!isPrevQuizPassed;
    }
    
    return true;
  };

  const getLockReason = (lessonId: number): string | null => {
    const idx = courseLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return null;
    
    const prevLesson = courseLessons[idx - 1];
    const isPrevComplete = completions?.some((c) => c.lessonId === prevLesson.id && c.userId === user?.userId);
    
    if (!isPrevComplete) return `Complete "${prevLesson.title}" first`;
    
    const prevQuiz = quizzes?.find((q) => q.lessonId === prevLesson.id);
    if (prevQuiz) {
      const isPrevQuizPassed = attempts?.some((a) => a.quizId === prevQuiz.id && a.userId === user?.userId && a.isPassed);
      if (!isPrevQuizPassed) return `Pass the quiz for "${prevLesson.title}" first`;
    }
    
    return null;
  };

  useEffect(() => {
    if (courseLessons.length > 0 && currentLessonId === 0) {
      setCurrentLessonId(courseLessons[0].id);
    }
  }, [courseLessons, currentLessonId]);

  const currentLesson = courseLessons.find((l) => l.id === currentLessonId);
  const currentIndex = courseLessons.findIndex((l) => l.id === currentLessonId);
  const hasNext = currentIndex < courseLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const goToNext = () => {
    if (hasNext) setCurrentLessonId(courseLessons[currentIndex + 1].id);
  };

  const goToPrevious = () => {
    if (hasPrevious) setCurrentLessonId(courseLessons[currentIndex - 1].id);
  };

  const handleMarkComplete = () => {
    markCompleteMutation.mutate();
  };

  const loading = courseLoading || lessonsLoading;
  const error = courseError;
  const isLocked = !canAccessLesson(currentLessonId);
  const lockReason = isLocked ? getLockReason(currentLessonId) : null;

  if (loading) return <AppShell><Spinner /></AppShell>;
  if (error) return <AppShell><ErrorBanner message="Failed to load lesson" /></AppShell>;
  if (!course) return <AppShell><ErrorBanner message="Course not found" /></AppShell>;
  if (!currentLesson) return <AppShell><ErrorBanner message="No lessons available" /></AppShell>;

  if (isLocked) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center bg-gray-900 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Lesson Locked</h2>
            <p className="text-gray-400">{lockReason}</p>
            <button
              onClick={() => window.history.back()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Back to Progress
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-[80vh] flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-800 bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white" onClick={() => window.history.back()}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{course.title}</h1>
                <p className="text-sm text-gray-400">Lesson {currentIndex + 1} of {courseLessons.length}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-400 hover:text-white">
                {sidebarOpen ? <X className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className={`flex flex-1 flex-col ${sidebarOpen ? 'lg:mr-80' : ''}`}>
            <div className="flex flex-1 items-center justify-center bg-black">
              {currentLesson.lessonType === 'Video' ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-gray-800">
                    {currentLesson.videoUrl ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={currentLesson.videoUrl}
                        title={currentLesson.title}
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">No video URL provided</div>
                    )}
                  </div>
                </div>
              ) : currentLesson.lessonType === 'Text' ? (
                <div className="w-full max-w-4xl overflow-y-auto bg-white p-8 text-gray-900">
                  <h2 className="mb-4 text-2xl font-bold">{currentLesson.title}</h2>
                  <div className="text-gray-700 whitespace-pre-wrap">{currentLesson.content || 'No content available.'}</div>
                </div>
              ) : currentLesson.lessonType === 'File' ? (
                <div className="w-full max-w-4xl overflow-y-auto bg-white p-8 text-gray-900">
                  <h2 className="mb-4 text-2xl font-bold">{currentLesson.title}</h2>
                  {currentLesson.videoUrl ? (
                    <div className="space-y-4">
                      <p className="text-gray-600">This lesson contains a file attachment. Click below to view or download it.</p>
                      <a
                        href={currentLesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Open File</span>
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-500">No file URL provided</div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-4xl overflow-y-auto bg-white p-8 text-gray-900">
                  <h2 className="mb-4 text-2xl font-bold">{currentLesson.title}</h2>
                  <div className="text-gray-500">Unknown lesson type</div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 bg-gray-800 px-6 py-4">
              <div className="space-y-3">
                {isLessonComplete && linkedQuiz && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-50/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-100">Quiz Available</p>
                      <p className="text-xs text-amber-200/70">{linkedQuiz.title}</p>
                    </div>
                    <button
                      onClick={() => nav(`/quiz/${linkedQuiz.id}/take`)}
                      className="flex items-center space-x-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={goToPrevious}
                    disabled={!hasPrevious}
                    className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition ${
                      hasPrevious ? 'bg-gray-700 text-white hover:bg-gray-600' : 'cursor-not-allowed bg-gray-900 text-gray-600'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-70"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{markCompleteMutation.isPending ? 'Saving...' : 'Mark Complete'}</span>
                  </button>

                  <button
                    onClick={goToNext}
                    disabled={!hasNext}
                    className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition ${
                      hasNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-900 text-gray-600'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {showNotes && (
              <div className="border-t border-gray-800 bg-gray-800 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <p className="text-sm text-gray-400">Capture your key learnings</p>
                  </div>
                  <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <textarea
                  className="h-32 w-full rounded-lg border border-gray-600 bg-gray-700 p-4 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Take notes here..."
                />
                <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Save Notes</button>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="fixed right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-800 bg-gray-800">
              <div className="border-b border-gray-700 bg-gray-900 px-6 py-4">
                <h2 className="text-lg font-semibold">Course content</h2>
                <p className="text-sm text-gray-400">{courseLessons.length} lessons</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2 p-4">
                  {courseLessons.map((lesson) => {
                    const lessonLocked = !canAccessLesson(lesson.id);
                    const lessonComplete = completions?.some((c) => c.lessonId === lesson.id && c.userId === user?.userId);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !lessonLocked && setCurrentLessonId(lesson.id)}
                        disabled={lessonLocked}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                          lessonLocked
                            ? 'cursor-not-allowed border-gray-600 bg-gray-700/50 text-gray-500'
                            : lesson.id === currentLessonId
                            ? 'border-blue-500 bg-blue-50/10 text-blue-100'
                            : 'border-gray-700 text-gray-100 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          {lessonLocked ? (
                            <Lock className="h-4 w-4 flex-shrink-0" />
                          ) : lessonComplete ? (
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />
                          ) : null}
                          <div>
                            <div className="font-semibold">{lesson.title}</div>
                            <div className="text-sm text-gray-400">{lesson.estimatedDuration ? `${lesson.estimatedDuration} min` : 'Self-paced'}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3 border-t border-gray-700 bg-gray-900 px-6 py-4">
                <button
                  onClick={() => setShowNotes((v) => !v)}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gray-700 px-4 py-3 text-white transition hover:bg-gray-600"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Toggle Notes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
