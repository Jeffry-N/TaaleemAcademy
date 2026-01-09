import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { createCourse, fetchCategories, fetchCourseById, updateCourse, fetchLessons, createLesson, updateLesson, deleteLesson } from '../../api/taaleem';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';

export const CourseEditorPage = ({ mode }: { mode: 'create' | 'edit' }) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const params = useParams();
  const courseId = params.id ? parseInt(params.id, 10) : undefined;

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseById(courseId!),
    enabled: mode === 'edit' && !!courseId,
  });
  const { data: lessons, refetch: refetchLessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
    enabled: mode === 'edit',
  });

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    categoryId: 0,
    difficulty: 'Beginner',
    thumbnailUrl: '',
    estimatedDuration: 0,
    isPublished: false,
  });

  useEffect(() => {
    if (course && mode === 'edit') {
      setForm({
        title: course.title,
        shortDescription: course.shortDescription ?? '',
        longDescription: course.longDescription ?? '',
        categoryId: course.categoryId,
        difficulty: course.difficulty,
        thumbnailUrl: course.thumbnailUrl ?? '',
        estimatedDuration: course.estimatedDuration ?? 0,
        isPublished: course.isPublished,
      });
    }
  }, [course, mode]);

  const createMut = useMutation({
    mutationFn: () => createCourse({ ...form, createdBy: user!.userId }),
    onSuccess: (c) => nav(`/instructor/courses/${c.id}/edit`),
  });
  const updateMut = useMutation({
    mutationFn: () => updateCourse(courseId!, { id: courseId!, createdBy: user!.userId, ...form }),
    onSuccess: () => nav('/instructor/courses'),
  });

  const createLessonMut = useMutation({
    mutationFn: (payload: { title: string; lessonType: string; orderIndex: number; estimatedDuration?: number; content?: string; videoUrl?: string }) =>
      createLesson({ courseId: courseId!, ...payload }),
    onSuccess: () => refetchLessons(),
  });
  const updateLessonMut = useMutation({
    mutationFn: (payload: any) => updateLesson(payload.id, payload),
    onSuccess: () => refetchLessons(),
  });
  const deleteLessonMut = useMutation({
    mutationFn: (id: number) => deleteLesson(id),
    onSuccess: () => refetchLessons(),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') createMut.mutate();
    else updateMut.mutate();
  };

  if (mode === 'edit' && isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load course'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{mode === 'create' ? 'Create Course' : 'Edit Course'}</h1>
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="w-full rounded border border-gray-300 p-2" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Short Description</label>
            <input className="w-full rounded border border-gray-300 p-2" value={form.shortDescription} onChange={e=>setForm(f=>({...f,shortDescription:e.target.value}))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Long Description</label>
            <textarea className="w-full rounded border border-gray-300 p-2" rows={4} value={form.longDescription} onChange={e=>setForm(f=>({...f,longDescription:e.target.value}))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select className="w-full rounded border border-gray-300 p-2" value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:parseInt(e.target.value,10)}))}>
                <option value={0}>Select category</option>
                {(categories ?? []).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Difficulty</label>
              <select className="w-full rounded border border-gray-300 p-2" value={form.difficulty} onChange={e=>setForm(f=>({...f,difficulty:e.target.value}))}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Thumbnail URL</label>
              <input className="w-full rounded border border-gray-300 p-2" value={form.thumbnailUrl} onChange={e=>setForm(f=>({...f,thumbnailUrl:e.target.value}))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estimated Duration (min)</label>
              <input type="number" className="w-full rounded border border-gray-300 p-2" value={form.estimatedDuration} onChange={e=>setForm(f=>({...f,estimatedDuration:parseInt(e.target.value||'0',10)}))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id="publish" type="checkbox" checked={form.isPublished} onChange={e=>setForm(f=>({...f,isPublished:e.target.checked}))} />
            <label htmlFor="publish">Published</label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>nav(-1)} className="rounded-md border border-gray-300 px-4 py-2">Cancel</button>
            <button disabled={createMut.isPending || updateMut.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              {mode === 'create' ? (createMut.isPending ? 'Creating...' : 'Create') : (updateMut.isPending ? 'Saving...' : 'Save Changes')}
            </button>
          </div>
        </form>

        {mode === 'edit' && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 text-lg font-semibold">Lessons</div>
            <LessonList
              lessons={(lessons ?? []).filter(l => l.courseId === courseId)}
              onCreate={(payload) => createLessonMut.mutate(payload)}
              onUpdate={(payload) => updateLessonMut.mutate(payload)}
              onDelete={(id) => deleteLessonMut.mutate(id)}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
};

type LessonItemProps = {
  lessons: Array<{ id: number; courseId: number; title: string; lessonType: string; orderIndex: number; estimatedDuration?: number | null; content?: string | null; videoUrl?: string | null }>;
  onCreate: (payload: { title: string; lessonType: string; orderIndex: number; estimatedDuration?: number; content?: string; videoUrl?: string }) => void;
  onUpdate: (payload: any) => void;
  onDelete: (id: number) => void;
};

const LessonList = ({ lessons, onCreate, onUpdate, onDelete }: LessonItemProps) => {
  const [draft, setDraft] = useState({ title: '', lessonType: 'Video', orderIndex: (lessons[lessons.length-1]?.orderIndex ?? -1)+1, estimatedDuration: 0, content: '', videoUrl: '' });

  return (
    <div className="space-y-4">
      <div className="rounded border border-gray-200 p-4">
        <div className="mb-2 font-medium">Add Lesson</div>
        <div className="grid gap-3 sm:grid-cols-5">
          <input className="rounded border border-gray-300 p-2 sm:col-span-2" placeholder="Title" value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} />
          <select className="rounded border border-gray-300 p-2" value={draft.lessonType} onChange={e=>setDraft(d=>({...d,lessonType:e.target.value}))}>
            <option>Video</option>
            <option>Text</option>
            <option>File</option>
          </select>
          <input type="number" className="rounded border border-gray-300 p-2" placeholder="Order" value={draft.orderIndex} onChange={e=>setDraft(d=>({...d,orderIndex:parseInt(e.target.value||'0',10)}))} />
          <input type="number" className="rounded border border-gray-300 p-2" placeholder="Minutes" value={draft.estimatedDuration} onChange={e=>setDraft(d=>({...d,estimatedDuration:parseInt(e.target.value||'0',10)}))} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded border border-gray-300 p-2" placeholder="Video URL (optional)" value={draft.videoUrl} onChange={e=>setDraft(d=>({...d,videoUrl:e.target.value}))} />
          <input className="rounded border border-gray-300 p-2" placeholder="Content (optional)" value={draft.content} onChange={e=>setDraft(d=>({...d,content:e.target.value}))} />
        </div>
        <div className="mt-3">
          <button onClick={()=>{ if(!draft.title) return; onCreate(draft); setDraft({ title: '', lessonType: 'Video', orderIndex: (lessons[lessons.length-1]?.orderIndex ?? -1)+1, estimatedDuration: 0, content: '', videoUrl: '' }); }} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add</button>
        </div>
      </div>

      {!lessons.length ? (
        <div className="text-gray-600">No lessons yet.</div>
      ) : (
        <div className="space-y-3">
          {lessons.sort((a,b)=>a.orderIndex-b.orderIndex).map(l => (
            <div key={l.id} className="rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <input className="mr-3 w-full rounded border border-gray-300 p-2" value={l.title} onChange={e=>onUpdate({ ...l, title: e.target.value })} />
                <button onClick={()=>onDelete(l.id)} className="ml-3 rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-4">
                <select className="rounded border border-gray-300 p-2" value={l.lessonType} onChange={e=>onUpdate({ ...l, lessonType: e.target.value })}>
                  <option>Video</option>
                  <option>Text</option>
                  <option>File</option>
                </select>
                <input type="number" className="rounded border border-gray-300 p-2" value={l.orderIndex} onChange={e=>onUpdate({ ...l, orderIndex: parseInt(e.target.value||'0',10) })} />
                <input type="number" className="rounded border border-gray-300 p-2" value={l.estimatedDuration ?? 0} onChange={e=>onUpdate({ ...l, estimatedDuration: parseInt(e.target.value||'0',10) })} />
                <input className="rounded border border-gray-300 p-2" placeholder="Video URL" value={l.videoUrl ?? ''} onChange={e=>onUpdate({ ...l, videoUrl: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
