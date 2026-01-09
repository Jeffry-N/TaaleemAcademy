import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { BookOpen, Award, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { fetchEnrollments, fetchLessons, fetchCategories, fetchCourses, fetchQuizAttempts } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';

export const StudentDashboardPage = () => {
  const { user } = useAuth();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', user?.userId],
    queryFn: () => fetchEnrollments(),
    enabled: !!user,
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: quizAttempts } = useQuery({
    queryKey: ['quizAttempts'],
    queryFn: fetchQuizAttempts,
  });

  const stats = [
    { label: 'Courses Enrolled', value: enrollments?.filter(e => e.userId === user?.userId).length ?? 0, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Completed', value: enrollments?.filter(e => e.userId === user?.userId && e.isCompleted).length ?? 0, icon: Award, color: 'bg-green-500' },
    { label: 'Hours Learned', value: Math.floor((quizAttempts?.length ?? 0) * 0.5), icon: Clock, color: 'bg-purple-500' },
    { label: 'Certificates', value: enrollments?.filter(e => e.userId === user?.userId && e.isCompleted).length ?? 0, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const userEnrollments = enrollments?.filter(e => e.userId === user?.userId) ?? [];
  const enrolledCourses = userEnrollments
    .map(enr => ({
      ...enr,
      course: courses?.find(c => c.id === enr.courseId),
      category: categories?.find(cat => cat.id === courses?.find(c => c.id === enr.courseId)?.categoryId),
      lastLesson: lessons?.filter(l => l.courseId === enr.courseId).sort((a, b) => b.orderIndex - a.orderIndex)[0]?.title ?? 'No lessons',
    }))
    .filter(c => c.course)
    .slice(0, 3);

  const continueLesson = enrolledCourses[0];

  const loading = enrollmentsLoading || lessonsLoading || coursesLoading;
  const error = null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName}! 👋</h1>
              <p className="mt-2 text-gray-600">Continue your learning journey</p>
            </div>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {loading && <Spinner />}

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-white ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {continueLesson && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {continueLesson.course?.thumbnailUrl && (
                    <img src={continueLesson.course.thumbnailUrl} alt="Course" className="w-full md:w-48 h-32 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-wide text-blue-100">Continue learning</p>
                    <h3 className="text-2xl font-bold">{continueLesson.course?.title}</h3>
                    <p className="mt-1 text-blue-100">Last lesson: {continueLesson.lastLesson}</p>
                    <div className="mt-3 h-2 w-full rounded-full bg-white/20">
                      <div className="h-2 rounded-full bg-white" style={{ width: `${continueLesson.completionPercentage}%` }} />
                    </div>
                  </div>
                  <Link to={`/courses/${continueLesson.courseId}`} className="rounded-lg bg-white px-4 py-2 font-semibold text-blue-700 shadow hover:bg-blue-50">Resume</Link>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your courses</h2>
                  <p className="text-sm text-gray-500">Jump back into your enrolled courses</p>
                </div>
                <Link to="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((ec) => (
                  <div key={ec.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    {ec.course?.thumbnailUrl && <img src={ec.course.thumbnailUrl} alt={ec.course.title} className="h-36 w-full object-cover" />}
                    <div className="p-4 space-y-2">
                      <p className="text-xs font-semibold uppercase text-blue-600">{ec.category?.name}</p>
                      <h3 className="text-lg font-bold text-gray-900">{ec.course?.title}</h3>
                      <p className="text-sm text-gray-500">Instructor {ec.course?.createdBy}</p>
                      <p className="text-sm text-gray-500">Last lesson: {ec.lastLesson}</p>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${ec.completionPercentage}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{ec.completionPercentage}% complete</span>
                        <Link to={`/courses/${ec.courseId}`} className="inline-flex items-center text-blue-600 hover:text-blue-700">Continue <ArrowRight className="ml-1 h-4 w-4" /></Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
