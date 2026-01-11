import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { fetchEnrollments, fetchCourses, fetchLessons, fetchLessonCompletions } from '../api/taaleem';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full rounded bg-gray-200">
    <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const ProgressPage = () => {
  const { user } = useAuth();
  const { data: enrollments, isLoading, error } = useQuery({ queryKey: ['enrollments'], queryFn: fetchEnrollments });
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: lessons } = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons });
  const { data: completions } = useQuery({ queryKey: ['lessonCompletions'], queryFn: fetchLessonCompletions });

  const items = useMemo(() => {
    if (!user || !enrollments || !lessons || !completions) {
      console.log('ProgressPage: Missing data', { user: !!user, enrollments: !!enrollments, lessons: !!lessons, completions: !!completions });
      return [];
    }
    
    console.log('ProgressPage user.userId:', user.userId, typeof user.userId);
    console.log('All completions:', completions);
    
    // Get all completions for current user - handle both string and number userId
    const userCompletions = new Set(
      completions.filter(c => {
        const match = String(c.userId) === String(user.userId);
        if (match) console.log('Matched completion:', c);
        return match;
      }).map(c => c.lessonId)
    );
    
    console.log('User completions set:', Array.from(userCompletions));
    
    // Map each enrollment to progress data
    return enrollments
      .filter(e => String(e.userId) === String(user.userId))
      .map(e => {
        const courseLessons = lessons.filter(l => l.courseId === e.courseId);
        const completed = courseLessons.filter(l => userCompletions.has(l.id)).length;
        const total = courseLessons.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        console.log(`Progress for course ${e.courseId}:`, { 
          completed, 
          total, 
          progress,
          courseLessons: courseLessons.map(l => l.id),
          userCompletions: Array.from(userCompletions)
        });
        
        return {
          ...e,
          courseTitle: courses?.find(c => c.id === e.courseId)?.title ?? `Course #${e.courseId}`,
          completionPercentage: progress,
        };
      });
  }, [enrollments, courses, lessons, completions, user]);

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load progress'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">My Progress</h1>
        {!items.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No enrollments yet.</div>
        ) : (
          <div className="space-y-4">
            {items.map((e) => (
              <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{e.courseTitle}</div>
                    <div className="text-sm text-gray-500">Enrolled: {new Date(e.enrolledAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm text-gray-600">{Math.round(e.completionPercentage)}%</div>
                </div>
                <div className="mt-2"><ProgressBar value={e.completionPercentage}/></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
