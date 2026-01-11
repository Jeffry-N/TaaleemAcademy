import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { createQuizAttempt, createStudentAnswer, fetchAnswersByQuiz, fetchQuestions, fetchQuizAttempts, fetchQuizById, updateQuizAttempt } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Answer, Question } from '../types/api';
import { CheckCircle, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

type QuestionWithAnswers = Question & { answers: Answer[] };

export const QuizTakePage = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qid = parseInt(quizId ?? '0', 10);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuery({
    queryKey: ['quiz', qid],
    queryFn: () => fetchQuizById(qid),
    enabled: qid > 0,
  });

  const { data: attempts, isLoading: attemptsLoading, error: attemptsError } = useQuery({
    queryKey: ['attempts', user?.userId],
    queryFn: fetchQuizAttempts,
    enabled: !!user,
  });

  const { data: questionsRaw, isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
  });

  const { data: answersRaw, isLoading: answersLoading, error: answersError } = useQuery({
    queryKey: ['answers', qid],
    queryFn: () => fetchAnswersByQuiz(qid),
    enabled: qid > 0,
  });

  // Shape questions with answers
  const questions: QuestionWithAnswers[] = useMemo(() => {
    if (!questionsRaw || !quiz || !answersRaw) return [];
    return questionsRaw
      .filter((q) => q.quizId === qid)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => ({
        ...q,
        answers: answersRaw
          .filter((a) => a.questionId === q.id)
          .sort((a, b) => a.orderIndex - b.orderIndex),
      }));
  }, [questionsRaw, answersRaw, quiz, qid]);

  // Initialize timer
  useEffect(() => {
    if (quiz && timeLeft === null) {
      startTimeRef.current = Date.now();
      setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null);
    }
  }, [quiz, timeLeft]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || quizSubmitted) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, quizSubmitted]);

  const attemptMut = useMutation({
    mutationFn: () => createQuizAttempt({ quizId: qid, userId: user!.userId }),
  });

  type ScoreSummary = {
    correct: number;
    total: number;
    percentage: number;
    earnedPoints: number;
    totalPoints: number;
    timeSpent: string;
    timeSpentSeconds: number;
    passed: boolean;
  };

  const answerMut = useMutation({
    mutationFn: async (payload: { attemptId: number; score: ScoreSummary }) => {
      const ops: Promise<unknown>[] = [];

      for (const q of questions) {
        if (q.questionType === 'ShortAnswer') {
          const text = textAnswers[q.id] ?? '';
          ops.push(createStudentAnswer({ attemptId: payload.attemptId, questionId: q.id, textAnswer: text, isCorrect: false, pointsEarned: 0 }));
          continue;
        }

        const selected = selectedAnswers[q.id] ?? [];
        const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
        const fullyCorrect = isFullyCorrect(q.questionType, selected, correctIds);
        const questionPoints = fullyCorrect ? q.points : 0;

        if (!selected.length) {
          ops.push(createStudentAnswer({ attemptId: payload.attemptId, questionId: q.id, isCorrect: false, pointsEarned: 0 }));
        } else {
          selected.forEach((ansId, idx) => {
            const ans = q.answers.find((a) => a.id === ansId);
            ops.push(
              createStudentAnswer({
                attemptId: payload.attemptId,
                questionId: q.id,
                answerId: ansId,
                isCorrect: ans?.isCorrect ?? false,
                pointsEarned: fullyCorrect && idx === 0 ? questionPoints : 0,
              })
            );
          });
        }
      }

      await Promise.all(ops);

      await updateQuizAttempt(payload.attemptId, {
        id: payload.attemptId,
        quizId: quiz!.id,
        userId: user!.userId,
        score: payload.score.percentage,
        totalPoints: payload.score.totalPoints,
        earnedPoints: payload.score.earnedPoints,
        submittedAt: new Date().toISOString(),
        timeTaken: payload.score.timeSpentSeconds,
        isPassed: payload.score.passed,
      });

      return payload.score;
    },
    onError: (err: any) => setSubmitError(err?.message ?? 'Failed to submit quiz'),
  });

  const computeScore = (): ScoreSummary => {
    let correct = 0;
    let earnedPoints = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const total = questions.length;
    questions.forEach((q) => {
      if (q.questionType === 'ShortAnswer') return;
      const selected = selectedAnswers[q.id] ?? [];
      const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
      const fullyCorrect = isFullyCorrect(q.questionType, selected, correctIds);
      if (fullyCorrect) {
        correct += 1;
        earnedPoints += q.points || 0;
      }
    });

    const percentage = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const spentSeconds = timeLeft !== null && quiz?.timeLimit ? quiz.timeLimit * 60 - timeLeft : startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const mins = Math.floor(spentSeconds / 60);
    const secs = spentSeconds % 60;
    const passed = percentage >= (quiz?.passingScore || 70);
    return { correct, total, percentage, earnedPoints, totalPoints, timeSpentSeconds: spentSeconds, timeSpent: `${mins}:${secs.toString().padStart(2, '0')}`, passed };
  };

  const handleSelect = (questionId: number, answerId: number, multi: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (!multi) return { ...prev, [questionId]: [answerId] };
      if (current.includes(answerId)) return { ...prev, [questionId]: current.filter((id) => id !== answerId) };
      return { ...prev, [questionId]: [...current, answerId] };
    });
  };

  const handleSubmit = async (auto = false) => {
    if (!quiz || !user) return;
    const attemptCount = (attempts || []).filter((a) => a.quizId === qid && a.userId === user.userId).length;
    const retakeBlocked = (!quiz.allowRetake && attemptCount >= 1) || (quiz.maxAttempts !== null && quiz.maxAttempts !== undefined && attemptCount >= quiz.maxAttempts);
    if (retakeBlocked) return;
    if (quizSubmitted || submitting) return;
    if (!auto && Object.keys(selectedAnswers).length < questions.filter((q) => q.questionType !== 'ShortAnswer').length) {
      const proceed = window.confirm('You have unanswered questions. Submit anyway?');
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const score = computeScore();
      setSubmitError(null);
      const attempt = await attemptMut.mutateAsync();
      await answerMut.mutateAsync({ attemptId: attempt.id, score });
      setQuizSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (quizLoading || questionsLoading || answersLoading || attemptsLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[80vh] items-center justify-center bg-gray-50"><Spinner /></div>
      </AppShell>
    );
  }

  if (quizError || questionsError || answersError || attemptsError) {
    return (
      <AppShell>
        <ErrorBanner message={(quizError as any)?.message || (questionsError as any)?.message || (answersError as any)?.message || (attemptsError as any)?.message || 'Failed to load quiz'} />
      </AppShell>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <AppShell>
        <ErrorBanner message="Quiz not found or has no questions" />
      </AppShell>
    );
  }

  const currentQuestion = questions[currentIdx];
  const attemptCount = (attempts || []).filter((a) => a.quizId === qid && a.userId === user?.userId).length;
  const retakeBlocked = (!quiz.allowRetake && attemptCount >= 1) || (quiz.maxAttempts !== null && quiz.maxAttempts !== undefined && attemptCount >= quiz.maxAttempts);

  if (retakeBlocked) {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-xl space-y-4 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">!</div>
            <h1 className="text-2xl font-bold text-gray-900">Retakes not allowed</h1>
            <p className="text-gray-700">You have reached the allowed attempts for this quiz.</p>
            <div className="text-sm text-gray-600">Attempts used: {attemptCount}{quiz.maxAttempts ? ` / ${quiz.maxAttempts}` : ''}</div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(-1)} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">Back</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const progressPct = ((currentIdx + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length + Object.keys(textAnswers).length;

  if (quizSubmitted) {
    const score = computeScore();
    const passed = score.percentage >= (quiz.passingScore || 70);
    return (
      <AppShell>
        <div className="min-h-[80vh] bg-gray-50 py-8">
          {submitError && <div className="mb-4"><ErrorBanner message={submitError} /></div>}
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 shadow">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passed ? 'Passed' : 'Needs improvement'}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600">You answered {score.correct} out of {score.total} correctly.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Score" value={`${score.percentage}%`} accent={passed ? 'text-green-600' : 'text-red-600'} />
              <Stat label="Correct" value={`${score.correct}/${score.total}`} />
              <Stat label="Passing Score" value={`${quiz.passingScore || 70}%`} />
              <Stat label="Time Spent" value={score.timeSpent} />
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-5xl space-y-4">
            {questions.map((q) => {
              const selected = selectedAnswers[q.id] ?? [];
              const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
              const correct = isFullyCorrect(q.questionType, selected, correctIds);
              const selectedText = selected
                .map((id) => q.answers.find((a) => a.id === id)?.answerText)
                .filter(Boolean)
                .join(', ');
              const correctText = correctIds
                .map((id) => q.answers.find((a) => a.id === id)?.answerText)
                .filter(Boolean)
                .join(', ');
              return (
                <div key={q.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="text-sm font-semibold text-gray-800">Q{q.orderIndex + 1}. {q.questionText}</div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  {q.questionType === 'ShortAnswer' ? (
                    <div className="text-sm text-gray-700">Your answer: {textAnswers[q.id] || 'Not answered'}</div>
                  ) : (
                    <div className="text-sm text-gray-700">
                      <div>Your answer: {selectedText || 'Not answered'}</div>
                      {!correct && <div className="text-gray-600">Correct answer: {correctText}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Retake</button>
            <button onClick={() => nav(-1)} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" /><span>Back</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isMulti = currentQuestion.questionType === 'MultiSelect';
  const selectedForCurrent = selectedAnswers[currentQuestion.id] ?? [];

  return (
    <AppShell>
      <div className="min-h-[80vh] bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <header className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase text-gray-500">Quiz</p>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">Question {currentIdx + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              {timeLeft !== null ? (
                <div className={`flex items-center space-x-1 rounded-full px-3 py-1 ${timeLeft < 60 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">No time limit</div>
              )}
              <div className="rounded-full bg-gray-100 px-3 py-1">Answered {answeredCount}/{questions.length}</div>
            </div>
          </header>

          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-blue-600" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 text-lg font-semibold text-gray-900">{currentQuestion.questionText}</div>

            {currentQuestion.questionType === 'ShortAnswer' ? (
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3"
                rows={3}
                value={textAnswers[currentQuestion.id] ?? ''}
                onChange={(e) => setTextAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                placeholder="Type your answer"
              />
            ) : (
              <div className="space-y-3">
                {currentQuestion.answers.map((ans) => {
                  const selected = selectedForCurrent.includes(ans.id);
                  return (
                    <button
                      key={ans.id}
                      onClick={() => handleSelect(currentQuestion.id, ans.id, isMulti)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                        selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <span className="text-gray-800">{ans.answerText}</span>
                      {selected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              {currentIdx < questions.length - 1 && (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {currentIdx === questions.length - 1 && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  <span>Submit quiz</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`text-2xl font-bold text-gray-900 ${accent ?? ''}`}>{value}</div>
  </div>
);

const isFullyCorrect = (questionType: string, selected: number[], correct: number[]) => {
  if (questionType === 'MultiSelect') {
    if (!selected.length && !correct.length) return true;
    if (selected.length !== correct.length) return false;
    const setSel = new Set(selected);
    return correct.every((id) => setSel.has(id));
  }
  // Single choice
  return selected.length === 1 && correct.length >= 1 && correct.includes(selected[0]);
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
