import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { createQuizAttempt, createStudentAnswer, fetchQuestions, fetchQuizById, fetchAnswersByQuiz } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Answer } from '../types/api';

export const QuizTakePage = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qid = parseInt(quizId!, 10);
  const { data: quiz, isLoading, error } = useQuery({ queryKey: ['quiz', qid], queryFn: () => fetchQuizById(qid) });
  const { data: questions } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });
  const { data: answersByQuiz, isLoading: answersLoading, error: answersError } = useQuery({ queryKey: ['answers', qid], queryFn: () => fetchAnswersByQuiz(qid) });
  const quizQuestions = useMemo(() => (questions ?? []).filter(q => q.quizId === qid).sort((a,b)=>a.orderIndex-b.orderIndex), [questions, qid]);

  const [textAnswers, setTextAnswers] = useState<Record<number,string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});

  const attemptMut = useMutation({
    mutationFn: () => createQuizAttempt({ quizId: qid, userId: user!.userId }),
  });
  const answerMut = useMutation({
    mutationFn: async (payload: { attemptId: number }) => {
      const ops: Promise<any>[] = [];
      // text answers
      for (const [questionId, textAnswer] of Object.entries(textAnswers)) {
        ops.push(createStudentAnswer({ attemptId: payload.attemptId, questionId: parseInt(questionId,10), textAnswer }));
      }
      // choice answers
      for (const [questionId, answerIds] of Object.entries(selectedAnswers)) {
        for (const ansId of answerIds) {
          ops.push(createStudentAnswer({ attemptId: payload.attemptId, questionId: parseInt(questionId,10), answerId: ansId }));
        }
      }
      await Promise.all(ops);
    },
    onSuccess: () => nav('/progress'),
  });

  const onSubmit = async () => {
    // basic validation: ensure every non-text question has a selection
    const missingChoice = quizQuestions.some(q => {
      const type = q.questionType as string;
      if (type === 'ShortAnswer') return false;
      return !(selectedAnswers[q.id] && selectedAnswers[q.id].length);
    });
    if (missingChoice) {
      alert('Please answer all choice questions.');
      return;
    }
    const attempt = await attemptMut.mutateAsync();
    await answerMut.mutateAsync({ attemptId: attempt.id });
  };

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load quiz'} />;

  if (answersError) return <AppShell><ErrorBanner message="Failed to load answers" /></AppShell>;
  const renderQuestion = (q: any) => {
    const answersForQuestion: Answer[] = (answersByQuiz ?? []).filter(a => a.questionId === q.id);
    const type = q.questionType as string;

    if (type === 'MCQ' || type === 'TrueFalse') {
      return (
        <div className="space-y-2">
          {answersForQuestion.map((opt) => {
            const selected = (selectedAnswers[q.id] ?? []).includes(opt.id);
            return (
              <label key={opt.id} className="flex items-start space-x-2 rounded border border-gray-200 p-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={selected}
                  onChange={() => setSelectedAnswers(a => ({ ...a, [q.id]: [opt.id] }))}
                />
                <span>{opt.answerText}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (type === 'MultiSelect') {
      return (
        <div className="space-y-2">
          {answersForQuestion.map((opt) => {
            const selected = (selectedAnswers[q.id] ?? []).includes(opt.id);
            return (
              <label key={opt.id} className="flex items-start space-x-2 rounded border border-gray-200 p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    setSelectedAnswers(a => {
                      const current = a[q.id] ?? [];
                      if (e.target.checked) return { ...a, [q.id]: [...current, opt.id] };
                      return { ...a, [q.id]: current.filter(id => id !== opt.id) };
                    });
                  }}
                />
                <span>{opt.answerText}</span>
              </label>
            );
          })}
        </div>
      );
    }

    // ShortAnswer fallback
    return (
      <textarea
        className="w-full rounded border border-gray-300 p-2"
        rows={2}
        value={textAnswers[q.id] ?? ''}
        onChange={e=>setTextAnswers(a=>({...a,[q.id]: e.target.value}))}
      />
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{quiz?.title ?? 'Quiz'}</h1>
        {!quizQuestions.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No questions available.</div>
        ) : (
          <div className="space-y-4">
            {quizQuestions.map(q => (
              <div key={q.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 font-medium text-gray-900">{q.orderIndex + 1}. {q.questionText}</div>
                {answersLoading && q.questionType !== 'ShortAnswer' ? <Spinner /> : renderQuestion(q)}
              </div>
            ))}
            <div className="flex justify-end"><button onClick={onSubmit} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Submit Answers</button></div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
