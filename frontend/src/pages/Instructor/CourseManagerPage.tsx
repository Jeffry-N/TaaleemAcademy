import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { fetchCourses } from '../../api/taaleem';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';

export const CourseManagerPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: courses, isLoading, error } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load courses'} />;

  // Filter courses based on role
  const myCourses = user?.role === 'Admin' 
    ? (courses ?? []) // Admins see all courses
    : (courses ?? []).filter(c => c.createdBy === user?.userId); // Instructors see only their courses

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
          <button onClick={() => nav('/instructor/courses/new')} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">New Course</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
              No courses yet. Create one to get started!
            </div>
          ) : (
            myCourses.map(c => (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
                {c.thumbnailUrl && (
                  <img src={c.thumbnailUrl} alt={c.title} className="mb-3 h-32 w-full rounded object-cover"/>
                )}
                <div className="text-lg font-semibold text-gray-900">{c.title}</div>
                <div className="text-sm text-gray-600">{c.difficulty} • {c.isPublished ? 'Published' : 'Draft'}</div>
                <div className="mt-3 flex gap-2">
                  <Link to={`/instructor/courses/${c.id}/edit`} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Edit</Link>
                  <Link to={`/courses/${c.id}`} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">View</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
};
