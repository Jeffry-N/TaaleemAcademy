import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { Award, Download, Share2, CheckCircle, Calendar, BookOpen, Target } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { fetchCertificateById, fetchCourseById, fetchUserById, fetchLessons, fetchLessonCompletions, fetchQuizzes, fetchQuizAttempts } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const CertificateDetailPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const certificateId = parseInt(searchParams.get('id') || '0', 10);
  const certificateRef = useRef<HTMLDivElement>(null);

  const { data: certificate, isLoading, error } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => fetchCertificateById(certificateId),
    enabled: certificateId > 0,
  });

  const { data: course } = useQuery({
    queryKey: ['course', certificate?.courseId],
    queryFn: () => fetchCourseById(certificate?.courseId ?? 0),
    enabled: !!certificate?.courseId,
  });

  const { data: instructor } = useQuery({
    queryKey: ['instructor', course?.createdBy],
    queryFn: () => fetchUserById(course!.createdBy),
    enabled: !!course?.createdBy,
  });

  const { data: lessons } = useQuery({ queryKey: ['lessons'], queryFn: fetchLessons });
  const { data: completions } = useQuery({ queryKey: ['lessonCompletions'], queryFn: fetchLessonCompletions });
  
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => fetchQuizzes(),
    enabled: !!course,
  });

  const { data: quizAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['quizAttempts'],
    queryFn: () => fetchQuizAttempts(),
    enabled: !!course,
  });

  const courseLessons = useMemo(() => {
    if (!lessons || !course) return [];
    return lessons.filter((l) => l.courseId === course.id);
  }, [lessons, course]);

  const completedCount = useMemo(() => {
    if (!completions || !user || !courseLessons.length) return 0;
    const done = new Set(completions.filter((c) => c.userId === user.userId).map((c) => c.lessonId));
    return courseLessons.filter((l) => done.has(l.id)).length;
  }, [completions, user, courseLessons]);

  const totalDuration = useMemo(() => {
    if (!courseLessons.length) return '0 hours';
    const minutes = courseLessons.reduce((sum, l) => sum + (l.estimatedMinutes || 0), 0);
    const hours = Math.max(1, Math.round(minutes / 60));
    return `${hours} hours`;
  }, [courseLessons]);

  // Calculate quiz statistics
  const quizStatistics = useMemo(() => {
    if (!quizzes || !quizAttempts || !user || !course) {
      return { score: 0, bestScore: 0, passedCount: 0, attemptedCount: 0, quizScores: [] };
    }

    const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);
    const userAttempts = quizAttempts.filter((a) => a.userId === user.userId);

    if (courseQuizzes.length === 0) {
      return { score: 0, bestScore: 0, passedCount: 0, attemptedCount: 0, quizScores: [] };
    }

    // Get best attempt per quiz
    const quizScores: { quizId: number; quizTitle: string; score: number; isPassed: boolean }[] = [];
    let totalScore = 0;
    let passedCount = 0;

    for (const quiz of courseQuizzes) {
      const attempts = userAttempts.filter((a) => a.quizId === quiz.id);
      if (attempts.length > 0) {
        const bestAttempt = attempts.reduce((best, current) => 
          (current.score ?? 0) > (best.score ?? 0) ? current : best
        );
        quizScores.push({
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: bestAttempt.score ?? 0,
          isPassed: bestAttempt.isPassed ?? false,
        });
        totalScore += bestAttempt.score ?? 0;
        if (bestAttempt.isPassed) passedCount++;
      }
    }

    const averageScore = quizScores.length > 0 ? Math.round(totalScore / quizScores.length) : 0;
    const bestScore = quizScores.length > 0 ? Math.max(...quizScores.map((q) => q.score)) : 0;

    return {
      score: averageScore,
      bestScore,
      passedCount,
      attemptedCount: quizScores.length,
      quizScores,
    };
  }, [quizzes, quizAttempts, user, course]);

  const handleDownload = async () => {
    if (!certificate || !course || !user) return;
    if (!certificateRef.current) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset = Math.max(margin, (pageHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`Certificate-${course.title.replace(/[^a-z0-9]/gi, '-')}-${user.fullName.replace(/[^a-z0-9]/gi, '-')}.pdf`);
    } catch (err) {
      console.error('Certificate download error:', err);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleShare = () => alert('Share options opened!');

  const completionDate = certificate?.generatedAt
    ? new Date(certificate.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const score = quizStatistics.score;
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  if (isLoading || quizzesLoading || attemptsLoading) return <AppShell><div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><Spinner /></div></AppShell>;
  if (error) return <AppShell><div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><ErrorBanner message="Failed to load certificate" /></div></AppShell>;
  if (!certificate) return <AppShell><div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"><ErrorBanner message="Certificate not found" /></div></AppShell>;

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h1>
            <p className="text-gray-600 text-lg">You've successfully completed the course</p>
          </div>

          <div ref={certificateRef} className="bg-white rounded-2xl shadow-2xl p-12 mb-8 border-8 border-blue-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-100 rounded-full -translate-x-16 -translate-y-16 opacity-50" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-100 rounded-full translate-x-16 translate-y-16 opacity-50" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
                  <Award className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-5xl font-serif font-bold text-gray-900 mb-2">Certificate of Completion</h2>
                <div className="w-32 h-1 bg-blue-600 mx-auto"></div>
              </div>

              <div className="text-center mb-8">
                <p className="text-gray-600 text-lg mb-6">This is to certify that</p>
                <h3 className="text-4xl font-bold text-blue-600 mb-6 font-serif">{user?.fullName}</h3>
                <p className="text-gray-600 text-lg mb-4">has successfully completed</p>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">{course?.title}</h4>
                <p className="text-gray-600">
                  Demonstrating exceptional dedication with a quiz average of{' '}
                  <span className="font-bold text-green-600">{quizStatistics.score}%</span>, earning a grade of{' '}
                  <span className="font-bold text-green-600">{grade}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t-2 border-gray-200">
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Date of Completion</p>
                  <p className="font-semibold text-gray-900">{completionDate}</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-semibold text-gray-900">{instructor?.fullName || 'Taaleem Academy'}</p>
                </div>
                <div className="text-center">
                  <Award className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="font-semibold text-gray-900 text-sm">CERT-{certificate.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-12">
                <div className="text-center">
                  <div className="border-t-2 border-gray-900 pt-2 inline-block px-12">
                    <p className="font-bold text-gray-900">{instructor?.fullName || 'Taaleem Academy'}</p>
                    <p className="text-sm text-gray-600">Course Instructor</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t-2 border-gray-900 pt-2 inline-block px-12">
                    <p className="font-bold text-gray-900">Taaleem Academy</p>
                    <p className="text-sm text-gray-600">Platform Director</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition font-semibold shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Download Certificate (PDF)</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-50 transition font-semibold border-2 border-gray-300"
            >
              <Share2 className="w-5 h-5" />
              <span>Share on LinkedIn</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Course Achievement Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{quizStatistics.score}%</p>
                <p className="text-sm text-gray-600 mt-1">Quiz Average Score</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{grade}</p>
                <p className="text-sm text-gray-600 mt-1">Overall Grade</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{quizStatistics.bestScore}%</p>
                <p className="text-sm text-gray-600 mt-1">Best Quiz Score</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{quizStatistics.passedCount}/{quizStatistics.attemptedCount}</p>
                <p className="text-sm text-gray-600 mt-1">Quizzes Passed</p>
              </div>
            </div>
            
            {quizStatistics.quizScores.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-4">Individual Quiz Scores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quizStatistics.quizScores.map((quiz) => (
                    <div key={quiz.quizId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{quiz.quizTitle}</p>
                        <p className="text-sm text-gray-600">{quiz.score}% {quiz.isPassed ? '✓ Passed' : '✗ Not Passed'}</p>
                      </div>
                      <div className={`text-lg font-bold ${quiz.isPassed ? 'text-green-600' : 'text-gray-400'}`}>
                        {quiz.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Lessons Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedCount}/{courseLessons.length}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Time Invested</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDuration}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Certificate Verification</h4>
                <p className="text-sm text-blue-800">
                  This certificate can be verified at{' '}
                  <span className="font-mono font-semibold">taaleemacademy.com/verify/CERT-{certificate.id}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button className="text-gray-600 hover:text-gray-900 font-medium" onClick={() => window.history.back()}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
