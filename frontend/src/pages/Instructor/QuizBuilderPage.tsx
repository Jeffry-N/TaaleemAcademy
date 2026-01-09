import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { createQuestion, createQuiz, deleteQuestion, deleteQuiz, fetchCourses, fetchQuestions, fetchQuizzes, updateQuestion, fetchQuizAttempts } from '../../api/taaleem';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';

export const QuizBuilderPage = () => {
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: quizzes, refetch: refetchQuizzes, isLoading, error } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
  const { data: questions, refetch: refetchQuestions } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });
  const { data: attempts } = useQuery({ queryKey: ['quizAttempts'], queryFn: fetchQuizAttempts });

  const [newQuiz, setNewQuiz] = useState({ title: '', courseId: 0, passingScore: 70 });
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const quizQuestions = useMemo(() => (questions ?? []).filter(q => q.quizId === selectedQuizId), [questions, selectedQuizId]);

  const createQuizMut = useMutation({
    mutationFn: () => createQuiz({
      courseId: newQuiz.courseId,
      title: newQuiz.title,
      description: '',
      isRequired: false,
      lessonId: null,
      maxAttempts: null,
      allowRetake: true,
      passingScore: newQuiz.passingScore,
      showCorrectAnswers: true,
      shuffleQuestions: false,
      timeLimit: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      id: 0,
    } as any),
    onSuccess: () => { setNewQuiz({ title: '', courseId: 0, passingScore: 70 }); refetchQuizzes(); },
  });

  // Note: quiz-level updates not currently exposed in UI; remove unused mutation

  const deleteQuizMut = useMutation({
    mutationFn: (id: number) => deleteQuiz(id),
    onSuccess: () => { setSelectedQuizId(null); refetchQuestions(); refetchQuizzes(); },
  });

  const createQuestionMut = useMutation({
    mutationFn: (payload: any) => createQuestion(payload),
    onSuccess: () => refetchQuestions(),
  });

  const updateQuestionMut = useMutation({
    mutationFn: (payload: any) => updateQuestion(payload.id, payload),
    onSuccess: () => refetchQuestions(),
  });

  const deleteQuestionMut = useMutation({
    mutationFn: (id: number) => deleteQuestion(id),
    onSuccess: () => refetchQuestions(),
  });

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load quizzes'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Quiz Builder</h1>

        {/* Create Quiz */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 text-lg font-semibold">Create Quiz</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input className="rounded border border-gray-300 p-2" placeholder="Quiz Title" value={newQuiz.title} onChange={e=>setNewQuiz(f=>({...f,title:e.target.value}))} />
            <select className="rounded border border-gray-300 p-2" value={newQuiz.courseId} onChange={e=>setNewQuiz(f=>({...f,courseId:parseInt(e.target.value,10)}))}>
              <option value={0}>Select Course</option>
              {(courses ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input type="number" className="rounded border border-gray-300 p-2" placeholder="Passing Score" value={newQuiz.passingScore} onChange={e=>setNewQuiz(f=>({...f,passingScore:parseInt(e.target.value||'0',10)}))} />
          </div>
          <div className="mt-3">
            <button disabled={!newQuiz.title || !newQuiz.courseId || createQuizMut.isPending} onClick={()=>createQuizMut.mutate()} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create Quiz</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quizzes list */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-1">
            <div className="mb-3 text-lg font-semibold">Quizzes</div>
            <div className="space-y-2">
              {(quizzes ?? []).map(q => (
                <div key={q.id} className={`flex items-center justify-between rounded border p-3 ${selectedQuizId === q.id ? 'border-blue-400' : 'border-gray-200'}`}>
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-sm text-gray-600">Course #{q.courseId} • Passing {q.passingScore}%</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setSelectedQuizId(q.id)} className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Edit</button>
                    <button onClick={()=>deleteQuizMut.mutate(q.id)} className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz editor */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-1">
            {!selectedQuizId ? (
              <div className="text-gray-600">Select a quiz to edit questions.</div>
            ) : (
              <div>
                <div className="mb-3 text-lg font-semibold">Questions</div>
                <div className="space-y-3">
                  {quizQuestions.map(qq => (
                    <div key={qq.id} className="rounded border border-gray-200 p-3">
                      <input className="w-full rounded border border-gray-300 p-2" value={qq.questionText} onChange={e=>updateQuestionMut.mutate({...qq, questionText: e.target.value})} />
                      <div className="mt-2 flex justify-between text-sm text-gray-600">
                        <div>Type: {qq.questionType} • Points: {qq.points}</div>
                        <button onClick={()=>deleteQuestionMut.mutate(qq.id)} className="text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>createQuestionMut.mutate({ quizId: selectedQuizId, questionText: 'New question', questionType: 'ShortAnswer', points: 1, orderIndex: (quizQuestions[quizQuestions.length-1]?.orderIndex ?? 0)+1 })} className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Add Question</button>
                </div>
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-1">
            <div className="mb-3 text-lg font-semibold">Analytics</div>
            {!quizzes?.length ? (
              <div className="text-gray-600">No quizzes yet.</div>
            ) : (
              <div className="space-y-2">
                {quizzes.map(q => {
                  const qAttempts = (attempts ?? []).filter(a => a.quizId === q.id);
                  const count = qAttempts.length;
                  const pass = qAttempts.filter(a => a.isPassed).length;
                  const rate = count ? Math.round((pass / count) * 100) : 0;
                  return (
                    <div key={q.id} className="rounded border border-gray-200 p-3">
                      <div className="font-medium">{q.title}</div>
                      <div className="text-sm text-gray-600">Attempts: {count} • Pass rate: {rate}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
