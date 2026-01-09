import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ArrowLeft, ArrowRight, Bell, BookOpen, CheckCircle, Menu, Search, Settings, X } from 'lucide-react';

export const QuizExperiencePage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[]>>({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const quiz = {
    title: 'React Fundamentals Quiz',
    course: 'Complete React.js Masterclass 2024',
    totalQuestions: 10,
    passingScore: 70,
    duration: '30 minutes',
  };

  const questions = useMemo(
    () => [
      {
        id: 1,
        question: 'What is React?',
        options: [
          'A JavaScript library for building user interfaces',
          'A programming language',
          'A database management system',
          'A CSS framework',
        ],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'What does JSX stand for?',
        options: ['JavaScript XML', 'Java Syntax Extension', 'JavaScript Extension', 'JSON XML'],
        correctAnswer: 0,
      },
      {
        id: 3,
        question: 'Which hook is used for managing state in functional components?',
        options: ['useEffect', 'useState', 'useContext', 'useReducer'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'What is the purpose of useEffect hook?',
        options: ['To manage state', 'To perform side effects', 'To create context', 'To optimize rendering'],
        correctAnswer: 1,
      },
      {
        id: 5,
        question: 'How do you pass data from parent to child component?',
        options: ['Using state', 'Using context', 'Using props', 'Using refs'],
        correctAnswer: 2,
      },
    ],
    [],
  );

  useEffect(() => {
    if (timeLeft > 0 && !quizSubmitted) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
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
    setQuizSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) correct++;
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  if (quizSubmitted) {
    const score = calculateScore();
    const passed = score.percentage >= quiz.passingScore;
    return (
      <AppShell>
        <div className="min-h-[80vh] bg-gray-50">
          <div className="text-center mb-8">
            {passed ? (
              <div className="mb-2 inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">Passed</div>
            ) : (
              <div className="mb-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">Needs improvement</div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <p className="text-gray-600 text-lg">{quiz.course}</p>
          </div>

          <div className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <Stat label="Score" value={`${score.percentage}%`} accent={passed ? 'text-green-600' : 'text-red-600'} />
              <Stat label="Correct" value={`${score.correct}/${score.total}`} />
              <Stat label="Passing Score" value={`${quiz.passingScore}%`} />
              <Stat label="Time Spent" value={`${formatTime(1800 - timeLeft)}`} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <p>Review each question and compare your answers with the correct responses below.</p>
            </div>
          </div>

          <div className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Question review</h2>
            <div className="space-y-4">
              {questions.map((q) => {
                const userAnswerIdx = selectedAnswers[q.id] as number | undefined;
                const isCorrect = userAnswerIdx === q.correctAnswer;
                return (
                  <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-semibold text-gray-700">Q{q.id}. {q.question}</div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                      <div className="font-semibold text-gray-900">Your answer:</div>
                      <div className="text-gray-700">{userAnswerIdx !== undefined ? q.options[userAnswerIdx] : 'Not answered'}</div>
                      <div className="mt-2 text-gray-600">Correct answer: {q.options[q.correctAnswer]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button onClick={() => window.location.reload()} className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
              <ArrowRight className="h-5 w-5" />
              <span>Retake quiz</span>
            </button>
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
                <div className="text-lg font-bold text-gray-900">{quiz.title}</div>
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
              <span>Time left: <strong>{formatTime(timeLeft)}</strong></span>
            </div>

            <div className="mb-6 h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>

            <div className="mb-4 text-xl font-bold text-gray-900">{currentQ.question}</div>
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const selected = selectedAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswerSelect(currentQ.id, idx)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                      selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <span className="text-gray-800">{opt}</span>
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
                  <button onClick={handleSubmit} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">Submit quiz</button>
                )}
              </div>
            </div>
          </div>

          <aside className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${sidebarOpen ? '' : 'hidden lg:block'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500">Overview</p>
                <p className="text-lg font-bold text-gray-900">{quiz.title}</p>
                <p className="text-sm text-gray-500">{quiz.course}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{quiz.duration}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {questions.map((q, idx) => {
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
                <span className="font-semibold text-gray-900">{quiz.passingScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Questions</span>
                <span className="font-semibold text-gray-900">{quiz.totalQuestions}</span>
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
