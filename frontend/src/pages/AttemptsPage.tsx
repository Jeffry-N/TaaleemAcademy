import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { fetchQuizAttempts, fetchQuizzes } from '../api/taaleem';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useNavigate } from 'react-router-dom';

export const AttemptsPage = () => {
  const nav = useNavigate();
  const { data: attempts, isLoading, error } = useQuery({ queryKey: ['quizAttempts'], queryFn: fetchQuizAttempts });
  const { data: quizzes } = useQuery({ queryKey: ['quizzes'], queryFn: fetchQuizzes });

  const rows = useMemo(() => {
    return (attempts ?? []).map((a) => ({
      ...a,
      quizTitle: quizzes?.find((q) => q.id === a.quizId)?.title ?? `Quiz #${a.quizId}`,
    }));
  }, [attempts, quizzes]);

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load attempts'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Attempts</h1>
        </div>
        {!rows.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No attempts yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Passed</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3">{a.quizTitle}</td>
                    <td className="px-4 py-3">{Math.round(a.score)}</td>
                    <td className="px-4 py-3">{a.isPassed ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{new Date(a.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={()=>nav(`/quiz/${a.quizId}/take`)} className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">Retake</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};
