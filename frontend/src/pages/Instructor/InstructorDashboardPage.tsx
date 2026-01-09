import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { Users, BookOpen, Award } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { fetchCourses, fetchEnrollments, fetchCertificates } from '../../api/taaleem';
import { useAuth } from '../../context/AuthContext';

export const InstructorDashboardPage = () => {
  const { user } = useAuth();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: fetchEnrollments,
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
  });

  const isLoading = coursesLoading || enrollmentsLoading || certificatesLoading;

  // Calculate instructor-specific stats
  const myCourses = useMemo(() => {
    return courses?.filter(c => c.createdBy === user?.userId) ?? [];
  }, [courses, user]);

  const myCourseIds = useMemo(() => {
    return new Set(myCourses.map(c => c.id));
  }, [myCourses]);

  const myStudents = useMemo(() => {
    // Get unique student IDs enrolled in any of my courses
    const studentIds = new Set(
      enrollments
        ?.filter(e => myCourseIds.has(e.courseId))
        .map(e => e.userId) ?? []
    );
    return studentIds.size;
  }, [enrollments, myCourseIds]);

  const myCertificates = useMemo(() => {
    // Certificates issued for my courses
    return certificates?.filter(cert => myCourseIds.has(cert.courseId)) ?? [];
  }, [certificates, myCourseIds]);

  const stats = [
    { 
      label: 'My Students', 
      value: myStudents, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'Unique students enrolled'
    },
    { 
      label: 'My Courses', 
      value: myCourses.length, 
      icon: BookOpen, 
      color: 'bg-green-500',
      description: 'Courses you created'
    },
    { 
      label: 'Certificates Issued', 
      value: myCertificates.length, 
      icon: Award, 
      color: 'bg-orange-500',
      description: 'From your courses'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your courses and students</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Course Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Published Courses</span>
                <span className="font-semibold text-gray-900">
                  {myCourses.filter(c => c.isPublished).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Draft Courses</span>
                <span className="font-semibold text-gray-900">
                  {myCourses.filter(c => !c.isPublished).length}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Total Enrollments</span>
                <span className="font-semibold text-blue-600">
                  {enrollments?.filter(e => myCourseIds.has(e.courseId)).length ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Student Progress</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Enrollments</span>
                <span className="font-semibold text-gray-900">
                  {enrollments?.filter(e => myCourseIds.has(e.courseId) && !e.isCompleted).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completed Courses</span>
                <span className="font-semibold text-gray-900">
                  {enrollments?.filter(e => myCourseIds.has(e.courseId) && e.isCompleted).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Certificates Issued</span>
                <span className="font-semibold text-orange-600">
                  {myCertificates.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
