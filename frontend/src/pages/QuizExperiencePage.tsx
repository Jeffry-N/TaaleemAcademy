import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { fetchQuizById, fetchQuestions, fetchAnswersByQuiz, createQuizAttempt, createStudentAnswer } from '../api/taaleem';
import type { Question, Answer } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Bell, BookOpen, CheckCircle, Menu, Search, Settings, X } from 'lucide-react';

export const QuizExperiencePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const quizId = parseInt(searchParams.get('id') || '0', 10);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuizById(quizId),
    enabled: quizId > 0,
  });

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz && timeLeft === null) {
      // Set timer based on quiz.timeLimit (in minutes) or null for unlimited
      setTimeLeft(quiz.timeLimit ? quiz.timeLimit * 60 : null);
    }
  }, [quiz, timeLeft]);

  const { data: allQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: fetchQuestions,
  });

  const { data: allAnswers, isLoading: answersLoading } = useQuery({
    queryKey: ['answers', quizId],
    queryFn: () => fetchAnswersByQuiz(quizId),
    enabled: quizId > 0,
  });

  // Mutation for creating quiz attempt and student answers
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!user || !quiz) throw new Error('User or quiz not found');

      // Create quiz attempt
      const attempt = await createQuizAttempt({
        quizId: quiz.id,
        userId: user.userId,
      });

      // Calculate score for each question
      const studentAnswersPromises = questions.map(async (q: any) => {
        const selectedAnswerId = selectedAnswers[q.id];
        if (selectedAnswerId === undefined) return null;

        const selectedAnswer = q.answers?.find((a: Answer) => a.id === selectedAnswerId);
        if (!selectedAnswer) return null;

        return createStudentAnswer({
          attemptId: attempt.id,
          questionId: q.id,
          answerId: selectedAnswerId,
          isCorrect: selectedAnswer.isCorrect,
          pointsEarned: selectedAnswer.isCorrect ? 10 : 0,
        });
      });

      await Promise.all(studentAnswersPromises);
      return attempt;
    },
    onSuccess: () => {
      setSubmitError(null);
      setQuizSubmitted(true);
    },
    onError: (error: any) => {
      setSubmitError(error.message || 'Failed to submit quiz');
    },
  });

  // Filter questions for this quiz and attach their answers
  const questions = useMemo(() => {
    if (!allQuestions || !quiz || !allAnswers) return [];
    return allQuestions
      .filter((q: Question) => q.quizId === quiz.id)
      .sort((a: Question, b: Question) => a.orderIndex - b.orderIndex)
      .map((q: Question) => ({
        ...q,
        answers: allAnswers.filter((a: Answer) => a.questionId === q.id).sort((a: Answer, b: Answer) => a.orderIndex - b.orderIndex),
      }));
  }, [allQuestions, quiz, allAnswers]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !quizSubmitted) {
      const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && !quizSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, quizSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion((q) => q + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion((q) => q - 1);
  };

  const handleSubmit = () => {
    if (!quizSubmitted && Object.keys(selectedAnswers).length < questions.length) {
      const proceed = window.confirm('You have unanswered questions. Submit anyway?');
      if (!proceed) return;
    }
    submitQuizMutation.mutate();
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: any) => {
      const selectedAnswerId = selectedAnswers[q.id];
      if (selectedAnswerId !== undefined) {
        const selectedAnswer = q.answers?.find((a: Answer) => a.id === selectedAnswerId);
        if (selectedAnswer?.isCorrect) correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    };
  };

  const isLoading = quizLoading || questionsLoading || answersLoading;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[80vh] items-center justify-center">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <AppShell>
        <ErrorBanner message="Quiz not found or has no questions" />
      </AppShell>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (quizSubmitted) {
    const score = calculateScore();
    const passed = score.percentage >= quiz.passingScore;
    return (
      <AppShell>
        <div className="min-h-[80vh] bg-gray-50">
          {submitError && <ErrorBanner message={`Submission error: ${submitError}`} />}
          <div className="text-center mb-8">
            {passed ? (
              <div className="mb-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">Passed</div>
            ) : (
              <div className="mb-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">Needs improvement</div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{quiz?.title || 'Quiz'}</h1>
          </div>

          <div className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <Stat label="Score" value={`${score.percentage}%`} accent={passed ? 'text-green-600' : 'text-red-600'} />
              <Stat label="Correct" value={`${score.correct}/${score.total}`} />
              <Stat label="Passing Score" value={`${quiz?.passingScore || 70}%`} />
              <Stat label="Time Spent" value={timeLeft !== null ? formatTime((quiz.timeLimit! * 60) - timeLeft) : 'N/A'} />
            </div>
            {quiz.showCorrectAnswers ? (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                <p>Review each question and compare your answers with the correct responses below.</p>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p>Your quiz has been submitted successfully. Correct answers are not shown for this quiz.</p>
              </div>
            )}
          </div>

          {quiz.showCorrectAnswers && (
            <div className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Question review</h2>
              <div className="space-y-4">
                {questions.map((q: any) => {
                  const selectedAnswerId = selectedAnswers[q.id];
                  const selectedAnswer = q.answers?.find((a: Answer) => a.id === selectedAnswerId);
                  const isCorrect = selectedAnswer?.isCorrect;
                  const correctAnswer = q.answers?.find((a: Answer) => a.isCorrect);
                  return (
                    <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="text-sm font-semibold text-gray-700">Q{q.orderIndex + 1}. {q.questionText}</div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">Your answer:</div>
                        <div className="text-gray-700">{selectedAnswer?.answerText || 'Not answered'}</div>
                        {!isCorrect && correctAnswer && <div className="mt-2 text-gray-600">Correct answer: {correctAnswer.answerText}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {quiz.allowRetake && (
              <button onClick={() => window.location.reload()} className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
                <ArrowRight className="h-5 w-5" />
                <span>Retake quiz</span>
              </button>
            )}
            {!quiz.allowRetake && (
              <div className="rounded-lg bg-gray-50 px-6 py-3 text-sm text-gray-600">
                Retakes are not allowed for this quiz.
              </div>
            )}
            <button onClick={() => setQuizSubmitted(false)} className="flex items-center justify-center space-x-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to questions</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[80vh] bg-gray-50">
        <header className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-600 hover:text-gray-900 lg:hidden">
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="rounded-lg bg-blue-600 p-2">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Quiz</div>
                <div className="text-lg font-bold text-gray-900">{quiz?.title || 'Quiz'}</div>
              </div>
            </div>
          </div>
          <div className="hidden items-center space-x-4 lg:flex text-gray-600">
            <Search className="h-5 w-5" />
            <Bell className="h-5 w-5" />
            <Settings className="h-5 w-5" />
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              {timeLeft !== null ? (
                <span>Time left: <strong className={timeLeft < 60 ? 'text-red-600' : ''}>{formatTime(timeLeft)}</strong></span>
              ) : (
                <span>No time limit</span>
              )}
            </div>

            <div className="mb-6 h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>

            <div className="mb-4 text-xl font-bold text-gray-900">{currentQ?.questionText}</div>
            <div className="space-y-3">
              {currentQ?.answers?.map((answer: Answer) => {
                const selected = selectedAnswers[currentQ.id] === answer.id;
                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(currentQ.id, answer.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                      selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-gray-800">{answer.answerText}</span>
                    {selected && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">Answered {answeredCount}/{questions.length}</div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handlePrevious} disabled={currentQuestion === 0} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">Previous</button>
                {currentQuestion < questions.length - 1 && (
                  <button onClick={handleNext} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Next question</button>
                )}
                {currentQuestion === questions.length - 1 && (
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitQuizMutation.isPending}
                    className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitQuizMutation.isPending ? 'Submitting...' : 'Submit quiz'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${sidebarOpen ? '' : 'hidden lg:block'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Overview</p>
                <p className="text-lg font-bold text-gray-900">{quiz?.title || 'Quiz'}</p>
              </div>
              {timeLeft !== null && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${timeLeft < 60 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {questions.map((q: any, idx: number) => {
                const answered = selectedAnswers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                      currentQuestion === idx ? 'bg-blue-600 text-white' : answered ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Passing score</span>
                <span className="font-semibold text-gray-900">{quiz?.passingScore || 70}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Questions</span>
                <span className="font-semibold text-gray-900">{questions.length}</span>
              </div>
            </div>
          </aside>
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
