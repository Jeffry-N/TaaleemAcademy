import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, Play, Layers, ArrowLeft, Sparkles } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  createEnrollment,
  fetchCourseById,
  fetchEnrollments,
  fetchLessonCompletions,
  fetchLessons,
  markLessonComplete,
  fetchQuizzes,
  fetchQuizAttempts,
  createCertificate,
  fetchUserById,
} from '../api/taaleem';
import { parseApiError } from '../api/client';
import type { Lesson } from '../types/api';
import { useAuth } from '../context/AuthContext';

const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes) return 'Self paced';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
};

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const courseId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    data: course,
    isLoading: isCourseLoading,
    error: courseError,
  } = useQuery({ queryKey: ['course', courseId], queryFn: () => fetchCourseById(courseId), enabled: !!courseId });

  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  });

  const { data: completions, isLoading: completionsLoading, error: completionsError } = useQuery({
    queryKey: ['lessonCompletions'],
    queryFn: fetchLessonCompletions,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: fetchEnrollments,
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', course?.createdBy],
    queryFn: () => fetchUserById(course!.createdBy),
    enabled: !!course?.createdBy,
  });

  const { data: quizzes } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
  const { data: quizAttempts } = useQuery({ queryKey: ['quizAttempts'], queryFn: fetchQuizAttempts });
  const issueCertMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('You must be logged in.');
      return createCertificate({
        courseId,
        userId: user.userId,
        certificateCode: `CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        downloadUrl: '',
        issuedBy: user.userId,
      });
    },
    onSuccess: () => {
      setFeedback('Certificate issued successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: (err: any) => {
      // Don't show error if certificate already exists (that's expected)
      const errorMessage = parseApiError(err);
      if (errorMessage.includes('already exists')) {
        console.log('Certificate already exists for this course');
      } else {
        setFeedback(errorMessage);
      }
    },
  });

  const [autoIssued, setAutoIssued] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('You must be logged in to enroll.');
      return createEnrollment(user.userId, courseId);
    },
    onSuccess: () => {
      setFeedback('Enrolled successfully');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error) => setFeedback(parseApiError(error)),
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: number) => {
      if (!user) throw new Error('You must be logged in.');
      return markLessonComplete(lessonId, user.userId);
    },
    onSuccess: () => {
      setFeedback('Lesson marked complete');
      queryClient.invalidateQueries({ queryKey: ['lessonCompletions'] });
    },
    onError: (error) => setFeedback(parseApiError(error)),
  });

  const courseLessons = useMemo(() => {
    return (lessons || []).filter((l) => l.courseId === courseId).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [lessons, courseId]);

  const completedLessonIds = useMemo(() => {
    if (!user || !completions) {
      console.log('CourseDetailsPage: Missing data', { user: !!user, completions: !!completions });
      return new Set<number>();
    }
    
    console.log('CourseDetailsPage user.userId:', user.userId, typeof user.userId);
    console.log('All completions:', completions);
    
    // Only count completions for current user and current course - handle both string and number userId
    const completed = new Set(
      completions
        .filter(c => {
          const userMatch = String(c.userId) === String(user.userId);
          const lessonMatch = courseLessons.some(l => l.id === c.lessonId);
          if (userMatch && lessonMatch) console.log('Matched completion:', c);
          return userMatch && lessonMatch;
        })
        .map(c => c.lessonId)
    );
    
    console.log('Completed lesson IDs:', Array.from(completed));
    return completed;
  }, [completions, user, courseLessons]);

  const progress = useMemo(() => {
    if (!courseLessons.length) return 0;
    const completed = completedLessonIds.size;
    const total = courseLessons.length;
    const pct = Math.round((completed / total) * 100);
    console.log(`Course ${courseId} progress:`, { completed, total, pct });
    return pct;
  }, [courseLessons, completedLessonIds, courseId]);

  const isEnrolled = enrollments?.some((e) => e.courseId === courseId) ?? false;
  const courseQuizzes = useMemo(() => (quizzes ?? []).filter(q => q.courseId === courseId), [quizzes, courseId]);
  const myQuizAttempts = useMemo(() => (quizAttempts ?? []).filter(a => courseQuizzes.some(q => q.id === a.quizId)), [quizAttempts, courseQuizzes]);
  
  const overallScore = useMemo(() => {
    if (!courseQuizzes.length) return null;
    
    // For each quiz, get the highest scoring attempt
    const highestScores = courseQuizzes.map(quiz => {
      const attemptsForQuiz = myQuizAttempts.filter(a => a.quizId === quiz.id);
      if (!attemptsForQuiz.length) return 0;
      return Math.max(...attemptsForQuiz.map(a => a.score));
    });
    
    // Average the highest scores from each quiz
    const avg = highestScores.reduce((sum, score) => sum + score, 0) / highestScores.length;
    return Math.round(avg * 10) / 10; // 1 decimal place
  }, [courseQuizzes, myQuizAttempts]);

  const canIssueCertificate = useMemo(() => {
    if (progress !== 100) return false;
    if (!courseQuizzes.length) return true;
    // All quizzes must be passed
    const allPassed = courseQuizzes.every(q => myQuizAttempts.some(a => a.quizId === q.id && a.isPassed));
    if (!allPassed) return false;
    // Overall score must be >= 50
    return overallScore !== null && overallScore >= 50;
  }, [progress, courseQuizzes, myQuizAttempts, overallScore]);

  const loading = isCourseLoading || lessonsLoading || completionsLoading;
  const errorMsg = courseError
    ? parseApiError(courseError)
    : lessonsError
      ? parseApiError(lessonsError)
      : completionsError
        ? parseApiError(completionsError)
        : null;

  useEffect(() => {
    if (loading) return;
    if (!canIssueCertificate) return;
    if (!user) return;
    if (issueCertMutation.isPending || autoIssued) return;
    issueCertMutation.mutate();
    setAutoIssued(true);
  }, [loading, canIssueCertificate, user, issueCertMutation, autoIssued]);

  const firstIncomplete = courseLessons.find((l) => !completedLessonIds.has(l.id));

  const handleStart = () => {
    const targetId = firstIncomplete?.id ?? courseLessons[0]?.id;
    if (!targetId) return;
    const el = document.getElementById(`lesson-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMarkComplete = (lesson: Lesson) => {
    setFeedback(null);
    completeMutation.mutate(lesson.id);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {loading && <Spinner />}
        {errorMsg && <ErrorBanner message={errorMsg} />}

        {!loading && course && (
          <div 
            className="relative overflow-hidden rounded-2xl text-white shadow-xl"
            style={{
              backgroundImage: course.thumbnailUrl ? `url(${course.thumbnailUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90" />
            <div className="relative p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-50">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {course.difficulty}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold lg:text-4xl">{course.title}</h1>
                  <p className="mt-3 max-w-3xl text-blue-100">{course.longDescription ?? course.shortDescription}</p>
                  {instructor?.fullName && (
                    <p className="mt-2 text-sm text-blue-200">
                      Instructor: <span className="font-semibold">{instructor.fullName}</span>
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-blue-100">
                    <span className="inline-flex items-center space-x-2"><Clock className="h-4 w-4" /><span>{formatDuration(course.estimatedDuration)}</span></span>
                    <span className="inline-flex items-center space-x-2"><Layers className="h-4 w-4" /><span>{courseLessons.length} lessons</span></span>
                  </div>
                </div>
                <div className="w-full lg:w-80 shrink-0 rounded-xl bg-white/10 p-5 shadow-lg backdrop-blur">
                  <div className="mb-2 text-sm text-blue-100">Progress</div>
                  <div className="text-3xl font-bold">{progress}%</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/20">
                    <div className="h-2 rounded-full bg-white" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-5 flex flex-col gap-3">
                    {user?.role === 'Student' ? (
                      !isEnrolled ? (
                        <button
                          onClick={() => enrollMutation.mutate()}
                          className="rounded-lg bg-white py-3 text-center text-blue-700 transition hover:bg-blue-50"
                          disabled={enrollMutation.isPending}
                        >
                          {enrollMutation.isPending ? 'Enrolling...' : 'Enroll to start'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleStart}
                            className="flex items-center justify-center space-x-2 rounded-lg bg-white py-3 text-center font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            <Play className="h-5 w-5" />
                            <span>{firstIncomplete ? 'Continue learning' : 'Review lessons'}</span>
                          </button>
                          {courseQuizzes.length > 0 && (
                            <div className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${overallScore !== null && overallScore >= 50 ? 'bg-green-100 text-green-700' : 'bg-white/30 text-white'}`}>
                              Quiz Score: {overallScore !== null ? `${overallScore}%` : 'No attempts yet'} {courseQuizzes.length > 0 && '(Min 50% needed)'}
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <div className="rounded-lg bg-white/20 py-3 text-center text-white text-sm">
                        {user?.role === 'Instructor' ? 'Instructors cannot enroll' : 'Admins cannot enroll'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {feedback && <div className="text-sm text-blue-700">{feedback}</div>}

        {!loading && courseLessons.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
              <span className="text-sm text-gray-500">{completedLessonIds.size}/{courseLessons.length} completed</span>
            </div>
            <div className="space-y-3">
              {courseLessons.map((lesson) => {
                const completed = completedLessonIds.has(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    id={`lesson-${lesson.id}`}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm lg:flex-row lg:items-center"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 h-3 w-3 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-600">{lesson.lessonType} • {formatDuration(lesson.estimatedDuration)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Order {lesson.orderIndex}</span>
                      {isEnrolled && (
                        <button
                          onClick={() => navigate(`/lessons/viewer?courseId=${courseId}&lessonId=${lesson.id}`)}
                          className="inline-flex items-center space-x-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Play className="h-4 w-4" />
                          <span>View lesson</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkComplete(lesson)}
                        disabled={completed || completeMutation.isPending || !isEnrolled}
                        className={`inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          completed ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-60`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{completed ? 'Completed' : 'Mark complete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && courseQuizzes.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
            </div>
            <div className="space-y-3">
              {courseQuizzes.map(q => {
                const attemptsForQuiz = myQuizAttempts.filter(a => a.quizId === q.id);
                const last = attemptsForQuiz.sort((a,b)=> new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
                return (
                  <div key={q.id} className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm lg:flex-row lg:items-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{q.title}</div>
                      <div className="text-sm text-gray-600">Passing {q.passingScore}%{q.timeLimit ? ` • ${q.timeLimit} min` : ''}</div>
                      {last && (
                        <div className="text-sm text-gray-500">Last attempt: {new Date(last.startedAt).toLocaleString()} • {last.isPassed ? 'Passed' : 'Not passed'} • Score: {Math.round(last.score)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>navigate(`/quiz/${q.id}/take`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">{last ? 'Retake' : 'Take quiz'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && courseLessons.length === 0 && !errorMsg && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No lessons found for this course yet.
          </div>
        )}

        {!loading && canIssueCertificate && user && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Ready to issue a certificate</div>
                <div className="text-sm">This course is 100% complete{courseQuizzes.length > 0 ? ' and you passed all requirements' : ''}.</div>
              </div>
              <button
                onClick={() => issueCertMutation.mutate()}
                disabled={issueCertMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
              >
                {issueCertMutation.isPending ? 'Issuing...' : 'Generate Certificate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
