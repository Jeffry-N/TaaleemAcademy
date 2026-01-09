import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { Users, Layers, BookOpen, Award } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { fetchUsers, fetchCategories, fetchCourses, fetchCertificates } from '../../api/taaleem';

export const AdminDashboardPage = () => {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
  });

  const isLoading = usersLoading || categoriesLoading || coursesLoading || certificatesLoading;

  const stats = [
    { 
      label: 'Total Users', 
      value: users?.length ?? 0, 
      icon: Users, 
      color: 'bg-blue-500',
      description: 'All registered users'
    },
    { 
      label: 'Categories', 
      value: categories?.length ?? 0, 
      icon: Layers, 
      color: 'bg-purple-500',
      description: 'Course categories'
    },
    { 
      label: 'Total Courses', 
      value: courses?.length ?? 0, 
      icon: BookOpen, 
      color: 'bg-green-500',
      description: 'All courses in system'
    },
    { 
      label: 'Certificates Issued', 
      value: certificates?.length ?? 0, 
      icon: Award, 
      color: 'bg-orange-500',
      description: 'Total certifications'
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your learning management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Quick Stats Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">User Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-semibold text-gray-900">
                  {users?.filter(u => u.role === 'Student').length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Instructors</span>
                <span className="font-semibold text-gray-900">
                  {users?.filter(u => u.role === 'Instructor').length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Admins</span>
                <span className="font-semibold text-gray-900">
                  {users?.filter(u => u.role === 'Admin').length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-green-600">
                  {users?.filter(u => u.isActive).length ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Published Courses</span>
                <span className="font-semibold text-gray-900">
                  {courses?.filter(c => c.isPublished).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Draft Courses</span>
                <span className="font-semibold text-gray-900">
                  {courses?.filter(c => !c.isPublished).length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Categories</span>
                <span className="font-semibold text-gray-900">
                  {categories?.length ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Certificates</span>
                <span className="font-semibold text-orange-600">
                  {certificates?.length ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
