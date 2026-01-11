import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { createQuestion, createQuiz, deleteQuestion, deleteQuiz, fetchCourses, fetchQuestions, fetchQuizzes, updateQuestion, fetchQuizAttempts, updateQuiz, fetchAnswersByQuiz, createAnswer, updateAnswer, deleteAnswer, fetchLessons } from '../../api/taaleem';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Clock, Shuffle, Eye, RotateCcw, AlertCircle, CheckCircle, Plus, Trash2, GripVertical, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Quiz, Answer } from '../../types/api';

type ViewMode = 'list' | 'edit' | 'preview';

export const QuizBuilderPage = () => {
  const { user } = useAuth();
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: lessons } = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons });
  const { data: quizzes, refetch: refetchQuizzes, isLoading, error } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });
  const { data: questions, refetch: refetchQuestions } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });
  const { data: attempts } = useQuery({ queryKey: ['quizAttempts'], queryFn: fetchQuizAttempts });

  // Filter quizzes to only show those from courses created by this instructor
  const instructorQuizzes = useMemo(() => {
    if (!quizzes || !courses || !user) return [];
    const instructorCourseIds = courses.filter(c => c.createdBy === user.userId).map(c => c.id);
    return quizzes.filter(q => instructorCourseIds.includes(q.courseId));
  }, [quizzes, courses, user]);

  // Group quizzes by course
  const quizzesByCourseMemo = useMemo(() => {
    if (!instructorQuizzes || !courses) return new Map<number, any>();
    const grouped = new Map<number, any>();
    instructorQuizzes.forEach(quiz => {
      const course = courses.find(c => c.id === quiz.courseId);
      if (course) {
        if (!grouped.has(course.id)) {
          grouped.set(course.id, { course, quizzes: [] });
        }
        grouped.get(course.id)!.quizzes.push(quiz);
      }
    });
    return grouped;
  }, [instructorQuizzes, courses]);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newQuiz, setNewQuiz] = useState({ title: '', courseId: 0, passingScore: 70 });
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [newQuestion, setNewQuestion] = useState({ questionText: '', questionType: 'MCQ', points: 1 });
  const [newAnswerText, setNewAnswerText] = useState<Record<number, string>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Answer[]>>({});
  const [saveNotification, setSaveNotification] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const selectedQuiz = useMemo(() => instructorQuizzes?.find(q => q.id === selectedQuizId), [instructorQuizzes, selectedQuizId]);
  const quizQuestions = useMemo(() => (questions ?? []).filter(q => q.quizId === selectedQuizId).sort((a, b) => a.orderIndex - b.orderIndex), [questions, selectedQuizId]);

  const { refetch: refetchAnswers } = useQuery({
    queryKey: ['answers', selectedQuizId],
    queryFn: async () => {
      if (!selectedQuizId) return [];
      const answers = await fetchAnswersByQuiz(selectedQuizId);
      const grouped = answers.reduce((acc, answer) => {
        if (!acc[answer.questionId]) acc[answer.questionId] = [];
        acc[answer.questionId].push(answer);
        return acc;
      }, {} as Record<number, Answer[]>);
      setQuizAnswers(grouped);
      return answers;
    },
    enabled: !!selectedQuizId && viewMode === 'edit',
  });

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

  const updateQuizMut = useMutation({
    mutationFn: (payload: Partial<Quiz> & { id: number }) => updateQuiz(payload.id, payload as Quiz),
    onSuccess: () => { 
      setSaveNotification(true);
      setTimeout(() => setSaveNotification(false), 3000);
      refetchQuizzes(); 
    },
  });

  const deleteQuizMut = useMutation({
    mutationFn: (id: number) => deleteQuiz(id),
    onSuccess: () => { setSelectedQuizId(null); setViewMode('list'); refetchQuestions(); refetchQuizzes(); },
  });

  const createQuestionMut = useMutation({
    mutationFn: async (payload: any) => {
      const question = await createQuestion(payload);
      if (payload.questionType === 'TrueFalse') {
        await createAnswer({ questionId: question.id, answerText: 'True', isCorrect: false });
        await createAnswer({ questionId: question.id, answerText: 'False', isCorrect: false });
      }
      return question;
    },
    onSuccess: () => { refetchQuestions(); refetchAnswers(); setNewQuestion({ questionText: '', questionType: 'MCQ', points: 1 }); },
  });

  const updateQuestionMut = useMutation({
    mutationFn: (payload: any) => updateQuestion(payload.id, payload),
    onSuccess: () => refetchQuestions(),
  });

  const deleteQuestionMut = useMutation({
    mutationFn: (id: number) => deleteQuestion(id),
    onSuccess: () => { refetchQuestions(); refetchAnswers(); },
  });

  const createAnswerMut = useMutation({
    mutationFn: (payload: { questionId: number; answerText: string; isCorrect: boolean }) => createAnswer(payload),
    onSuccess: () => refetchAnswers(),
  });

  const updateAnswerMut = useMutation({
    mutationFn: (payload: { id: number; answer: Answer; updates: Partial<Answer> }) => updateAnswer(payload.id, { ...payload.answer, ...payload.updates }),
    onSuccess: () => refetchAnswers(),
    onError: (error) => {
      console.error('Failed to update answer:', error);
      alert('Failed to update answer. Please try again.');
    },
  });

  const deleteAnswerMut = useMutation({
    mutationFn: (id: number) => deleteAnswer(id),
    onSuccess: () => refetchAnswers(),
  });

  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuizId(quiz.id);
    setEditingQuiz(quiz);
    setViewMode('edit');
  };

  const handleSaveQuizSettings = () => {
    if (editingQuiz && selectedQuizId) {
      updateQuizMut.mutate({ ...editingQuiz, id: selectedQuizId } as any);
    }
  };

  const handleAddQuestion = () => {
    if (!selectedQuizId || !newQuestion.questionText.trim()) return;
    createQuestionMut.mutate({
      quizId: selectedQuizId,
      questionText: newQuestion.questionText,
      questionType: newQuestion.questionType,
      points: newQuestion.points,
      orderIndex: quizQuestions.length + 1,
    });
  };

  const handleAddAnswer = (questionId: number) => {
    const text = newAnswerText[questionId]?.trim();
    if (!text) return;
    createAnswerMut.mutate({ questionId, answerText: text, isCorrect: false });
    setNewAnswerText(prev => ({ ...prev, [questionId]: '' }));
  };

  const handlePreview = () => {
    if (selectedQuizId) {
      setViewMode('preview');
    }
  };

  const courseLessons = useMemo(() => {
    if (!editingQuiz?.courseId) return [];
    return (lessons ?? []).filter(l => l.courseId === editingQuiz.courseId);
  }, [lessons, editingQuiz?.courseId]);

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load quizzes'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {saveNotification && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Changes saved successfully!</span>
          </div>
        )}
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-6 shadow-xl max-w-sm w-full mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{confirmDialog.title}</h2>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmDialog(null)} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quiz Builder</h1>
          {viewMode !== 'list' && (
            <button onClick={() => { setViewMode('list'); setSelectedQuizId(null); setEditingQuiz(null); }} className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </button>
          )}
        </div>

        {viewMode === 'list' && (
          <>
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Create New Quiz</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                  <input className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" placeholder="Enter title" value={newQuiz.title} onChange={e=>setNewQuiz(f=>({...f,title:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" value={newQuiz.courseId} onChange={e=>setNewQuiz(f=>({...f,courseId:parseInt(e.target.value,10)}))}>
                    <option value={0}>Select Course</option>
                    {(courses ?? []).filter(c => c.createdBy === user?.userId).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                  <input type="number" min="0" max="100" className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" placeholder="70" value={newQuiz.passingScore} onChange={e=>setNewQuiz(f=>({...f,passingScore:parseInt(e.target.value||'0',10)}))} />
                  <p className="mt-1 text-xs text-gray-500">Minimum % score to pass</p>
                </div>
              </div>
              <div className="mt-4">
                <button disabled={!newQuiz.title || !newQuiz.courseId || createQuizMut.isPending} onClick={()=>createQuizMut.mutate()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300">
                  <Plus className="h-4 w-4" />
                  Create Quiz
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Your Quizzes</h2>
                {instructorQuizzes && instructorQuizzes.length > 0 ? (
                  <div className="space-y-6">
                    {Array.from(quizzesByCourseMemo.values()).map(({ course, quizzes: courseQuizzes }) => (
                      <div key={course.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        </div>
                        <div className="space-y-3 p-4">
                          {courseQuizzes.map((q: Quiz) => {
                            const qCount = (questions ?? []).filter(qq => qq.quizId === q.id).length;
                            return (
                              <div key={q.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900">{q.title}</h3>
                                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" />Pass: {q.passingScore}%</span>
                                      <span className="flex items-center gap-1"><FileText className="h-4 w-4 text-blue-600" />{qCount} Question{qCount !== 1 ? 's' : ''}</span>
                                      {q.timeLimit && (<span className="flex items-center gap-1"><Clock className="h-4 w-4 text-orange-600" />{q.timeLimit} min</span>)}
                                      {q.isRequired && (<span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-red-600" />Required</span>)}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <button onClick={()=>handleEditQuiz(q)} className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">Edit</button>
                                    <button onClick={()=>setConfirmDialog({ isOpen: true, title: 'Delete Quiz', message: `Are you sure you want to delete "${q.title}"? This action cannot be undone.`, onConfirm: () => deleteQuizMut.mutate(q.id) })} className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    No quizzes yet. Create your first quiz above!
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Quiz Analytics</h2>
                {instructorQuizzes && instructorQuizzes.length > 0 ? (
                  <div className="space-y-6">
                    {Array.from(quizzesByCourseMemo.values()).map(({ course, quizzes: courseQuizzes }) => (
                      <div key={course.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        </div>
                        <div className="space-y-3 p-4">
                          {courseQuizzes.map((q: Quiz) => {
                            const qAttempts = (attempts ?? []).filter(a => a.quizId === q.id);
                            const count = qAttempts.length;
                            const pass = qAttempts.filter(a => a.isPassed).length;
                            const rate = count ? Math.round((pass / count) * 100) : 0;
                            return (
                              <div key={q.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <h3 className="font-semibold text-gray-900">{q.title}</h3>
                                <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                                    <div className="text-xs text-gray-600">Attempts</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-green-600">{pass}</div>
                                    <div className="text-xs text-gray-600">Passed</div>
                                  </div>
                                  <div>
                                    <div className="text-2xl font-bold text-purple-600">{rate}%</div>
                                    <div className="text-xs text-gray-600">Pass Rate</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    No quizzes to analyze yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {viewMode === 'edit' && selectedQuiz && editingQuiz && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Quiz Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={editingQuiz.title || ''} onChange={e=>setEditingQuiz((prev: any)=>({...prev, title:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" rows={3} value={editingQuiz.description || ''} onChange={e=>setEditingQuiz((prev: any)=>({...prev, description:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={editingQuiz.courseId || 0} onChange={e=>setEditingQuiz((prev: any)=>({...prev, courseId:parseInt(e.target.value,10)}))}>
                      {(courses ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson/Module (Optional)</label>
                    <select className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={editingQuiz.lessonId || ''} onChange={e=>setEditingQuiz((prev: any)=>({...prev, lessonId:e.target.value?parseInt(e.target.value,10):null}))}>
                      <option value="">Course-level (No lesson)</option>
                      {courseLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Link quiz to a specific lesson/module</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><CheckCircle className="h-4 w-4 text-green-600" />Passing Score (%)</label>
                    <input type="number" min="0" max="100" className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={editingQuiz.passingScore || 70} onChange={e=>setEditingQuiz((prev: any)=>({...prev, passingScore:parseInt(e.target.value||'70',10)}))} />
                    <p className="mt-1 text-xs text-gray-500">Minimum % to pass (0-100)</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Clock className="h-4 w-4 text-orange-600" />Time Limit (minutes)</label>
                    <input type="number" min="0" className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Unlimited" value={editingQuiz.timeLimit || ''} onChange={e=>setEditingQuiz((prev: any)=>({...prev, timeLimit:e.target.value?parseInt(e.target.value,10):null}))} />
                    <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited time</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" checked={editingQuiz.shuffleQuestions || false} onChange={e=>setEditingQuiz((prev: any)=>({...prev, shuffleQuestions:e.target.checked}))} />
                    <Shuffle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Shuffle Questions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" checked={editingQuiz.showCorrectAnswers || false} onChange={e=>setEditingQuiz((prev: any)=>({...prev, showCorrectAnswers:e.target.checked}))} />
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Show Correct Answers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" checked={editingQuiz.allowRetake || false} onChange={e=>setEditingQuiz((prev: any)=>({...prev, allowRetake:e.target.checked}))} />
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Allow Retake</span>
                  </label>
                  {editingQuiz.allowRetake && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts</label>
                      <input type="number" min="1" className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Unlimited" value={editingQuiz.maxAttempts || ''} onChange={e=>setEditingQuiz((prev: any)=>({...prev, maxAttempts:e.target.value?parseInt(e.target.value,10):null}))} />
                      <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited attempts</p>
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" checked={editingQuiz.isRequired || false} onChange={e=>setEditingQuiz((prev: any)=>({...prev, isRequired:e.target.checked}))} />
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Required for Completion</span>
                  </label>
                  <button onClick={handleSaveQuizSettings} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Save Settings</button>
                  <button onClick={handlePreview} className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">Preview Quiz</button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Questions</h2>
                
                <div className="mb-6 rounded-lg bg-blue-50 p-4">
                  <h3 className="mb-3 font-medium text-gray-900">Add New Question</h3>
                  <div className="space-y-3">
                    <input className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Question text" value={newQuestion.questionText} onChange={e=>setNewQuestion(prev=>({...prev, questionText:e.target.value}))} />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <select className="rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={newQuestion.questionType} onChange={e=>setNewQuestion(prev=>({...prev, questionType:e.target.value}))}>
                        <option value="MCQ">Multiple Choice (Single)</option>
                        <option value="MultiSelect">Multiple Select</option>
                        <option value="TrueFalse">True/False</option>
                      </select>
                      <input type="number" min="1" className="rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Points" value={newQuestion.points} onChange={e=>setNewQuestion(prev=>({...prev, points:parseInt(e.target.value||'1',10)}))} />
                      <button onClick={handleAddQuestion} disabled={!newQuestion.questionText.trim()} className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-300">
                        <Plus className="h-4 w-4" />
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((qq, idx) => {
                    const answers = quizAnswers[qq.id] || [];
                    return (
                      <div key={qq.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-gray-900">Q{idx + 1}.</span>
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{qq.questionType}</span>
                                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">{qq.points} pt{qq.points !== 1 ? 's' : ''}</span>
                                </div>
                                <input className="w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={qq.questionText} onChange={e=>updateQuestionMut.mutate({...qq, questionText: e.target.value})} />
                              </div>
                              <button onClick={()=>setConfirmDialog({ isOpen: true, title: 'Delete Question', message: 'Are you sure you want to delete this question? This action cannot be undone.', onConfirm: () => deleteQuestionMut.mutate(qq.id) })} className="rounded p-2 text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div className="text-sm font-medium text-gray-700">Answer Options {qq.questionType === 'MCQ' && '(check ONE correct)'}{qq.questionType === 'MultiSelect' && '(check ALL correct)'}{qq.questionType === 'TrueFalse' && '(check the correct one)'}:</div>
                              {answers.length === 0 && (
                                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                                  ⚠️ No answer options yet! Add options below for students to choose from.
                                </div>
                              )}
                              {answers.map((ans) => (
                                <div key={ans.id} className="flex items-center gap-2">
                                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500" checked={ans.isCorrect} onChange={(e) => { e.stopPropagation(); updateAnswerMut.mutate({ id: ans.id, answer: ans, updates: { isCorrect: e.target.checked } }); }} title="Mark as correct answer" />
                                  <input className={`flex-1 rounded border p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${ans.isCorrect ? 'border-green-500 bg-green-50 font-medium' : 'border-gray-300'}`} value={ans.answerText} onChange={e=>updateAnswerMut.mutate({ id: ans.id, answer: ans, updates: { answerText: e.target.value } })} placeholder="Answer text" />
                                  <button onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, title: 'Delete Answer', message: 'Are you sure you want to delete this answer option?', onConfirm: () => deleteAnswerMut.mutate(ans.id) }); }} className="rounded p-2 text-red-600 hover:bg-red-50" title="Delete answer">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input className="flex-1 rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder={`Add answer option (e.g., ${qq.questionType === 'TrueFalse' ? 'True, False' : 'Option A, Option B'})`} value={newAnswerText[qq.id] || ''} onChange={e=>setNewAnswerText(prev=>({...prev, [qq.id]: e.target.value}))} onKeyDown={e=>{ if(e.key==='Enter') handleAddAnswer(qq.id); }} />
                                <button onClick={()=>handleAddAnswer(qq.id)} className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                                  <Plus className="h-4 w-4" />
                                  Add
                                </button>
                              </div>
                              <p className="text-xs text-gray-500">✓ Check the box to mark as correct answer • Press Enter to quickly add</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!quizQuestions.length && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                      No questions yet. Add your first question above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'preview' && selectedQuiz && (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
              <div className="mb-6 border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h2>
                {selectedQuiz.description && <p className="mt-2 text-gray-600">{selectedQuiz.description}</p>}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900">Pass: {selectedQuiz.passingScore}%</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{quizQuestions.length} Questions</span>
                  </div>
                  {selectedQuiz.timeLimit && (
                    <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1.5">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-900">{selectedQuiz.timeLimit} minutes</span>
                    </div>
                  )}
                  {selectedQuiz.allowRetake && (
                    <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5">
                      <RotateCcw className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Retake Allowed</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {quizQuestions.map((qq, idx) => {
                  const answers = quizAnswers[qq.id] || [];
                  return (
                    <div key={qq.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-start gap-2">
                        <span className="font-semibold text-gray-900">Q{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-gray-900">{qq.questionText}</p>
                          <p className="mt-1 text-xs text-gray-500">{qq.questionType} • {qq.points} point{qq.points !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {answers.map((ans) => (
                          <label key={ans.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${ans.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type={qq.questionType === 'MCQ' || qq.questionType === 'TrueFalse' ? 'radio' : 'checkbox'} name={`preview-q${qq.id}`} className="h-4 w-4" disabled />
                            <span className="text-sm text-gray-900">{ans.answerText}</span>
                            {ans.isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-green-600" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setViewMode('edit')} className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                  Continue Editing
                </button>
                <button onClick={() => { setViewMode('list'); setSelectedQuizId(null); setEditingQuiz(null); }} className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
                  Back to List
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
