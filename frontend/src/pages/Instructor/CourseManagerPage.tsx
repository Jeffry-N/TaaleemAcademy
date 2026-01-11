import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { fetchCourses, deleteCourse, publishCourse } from '../../api/taaleem';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { parseApiError } from '../../api/client';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export const CourseManagerPage = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: courses, isLoading, error } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; courseId: number | null; title?: string }>(
    { open: false, courseId: null, title: '' }
  );

  const unpublishMutation = useMutation({
    mutationFn: (courseId: number) => deleteCourse(courseId),
    onSuccess: () => {
      setSuccessMsg('Course unpublished successfully');
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ['courses'] });
      setTimeout(() => setSuccessMsg(null), 2500);
    },
    onError: (err: any) => {
      setErrorMsg(parseApiError(err));
      setSuccessMsg(null);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (courseId: number) => publishCourse(courseId),
    onSuccess: () => {
      setSuccessMsg('Course published successfully');
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ['courses'] });
      setTimeout(() => setSuccessMsg(null), 2500);
    },
    onError: (err: any) => {
      setErrorMsg(parseApiError(err));
      setSuccessMsg(null);
    }
  });

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
        {errorMsg && <ErrorBanner message={errorMsg} />}
        {successMsg && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-800">{successMsg}</div>
        )}
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
                  {c.isPublished ? (
                    <button
                      onClick={() => setConfirm({ open: true, courseId: c.id, title: c.title })}
                      disabled={unpublishMutation.isPending}
                      className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Unpublish course"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => publishMutation.mutate(c.id)}
                      disabled={publishMutation.isPending}
                      className="rounded-md border border-green-300 px-3 py-1 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                      title="Publish course"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, courseId: null })}
        onConfirm={() => {
          if (confirm.courseId) unpublishMutation.mutate(confirm.courseId);
          setConfirm({ open: false, courseId: null });
        }}
        title="Unpublish Course"
        message={`Are you sure you want to unpublish "${confirm.title ?? 'this course'}"? Students will no longer see it.`}
        confirmText="Unpublish"
        cancelText="Cancel"
      />
    </AppShell>
  );
};
