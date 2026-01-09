import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Users, Mail, BookOpen, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchEnrollments, 
  fetchCourses, 
  fetchUsers, 
  createEnrollment, 
  deleteEnrollment,
  fetchUserByEmail 
} from '../../api/taaleem';
import { AppShell } from '../../components/AppShell';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export const EnrollmentManagementPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnenrollModal, setShowUnenrollModal] = useState(false);
  const [studentToUnenroll, setStudentToUnenroll] = useState<{ enrollmentId: number; studentName: string } | null>(null);

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: fetchEnrollments,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Filter courses based on role
  const availableCourses = useMemo(() => {
    if (!courses || !user) return [];
    if (user.role === 'Admin') return courses;
    return courses.filter(c => c.createdBy === user.userId);
  }, [courses, user]);

  // Get enrollments for selected course
  const courseEnrollments = useMemo(() => {
    if (!selectedCourseId || !enrollments) return [];
    return enrollments.filter(e => e.courseId === selectedCourseId);
  }, [selectedCourseId, enrollments]);

  // Get student details for enrollments
  const enrolledStudents = useMemo(() => {
    if (!users) return [];
    return courseEnrollments.map(enrollment => {
      const student = users.find(u => u.id === enrollment.userId);
      return {
        enrollment,
        student,
      };
    }).filter(item => item.student);
  }, [courseEnrollments, users]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return enrolledStudents;
    const query = searchQuery.toLowerCase();
    return enrolledStudents.filter(item => 
      item.student?.fullName.toLowerCase().includes(query) ||
      item.student?.email.toLowerCase().includes(query)
    );
  }, [enrolledStudents, searchQuery]);

  const enrollMutation = useMutation({
    mutationFn: async (email: string) => {
      // Find user by email
      const student = await fetchUserByEmail(email);
      
      if (student.role !== 'Student') {
        throw new Error('Only students can be enrolled in courses');
      }

      // Check if already enrolled
      const alreadyEnrolled = enrollments?.some(
        e => e.userId === student.id && e.courseId === selectedCourseId
      );
      
      if (alreadyEnrolled) {
        throw new Error('Student is already enrolled in this course');
      }

      return createEnrollment(student.id, selectedCourseId!);
    },
    onSuccess: () => {
      setSuccess('Student enrolled successfully!');
      setError(null);
      setStudentEmail('');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to enroll student');
      setSuccess(null);
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (enrollmentId: number) => deleteEnrollment(enrollmentId),
    onSuccess: () => {
      setSuccess('Student unenrolled successfully!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to unenroll student');
      setSuccess(null);
    },
  });

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedCourseId) {
      setError('Please select a course first');
      return;
    }

    if (!studentEmail.trim()) {
      setError('Please enter student email');
      return;
    }

    if (!studentEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    enrollMutation.mutate(studentEmail.trim());
  };

  const handleUnenroll = (enrollmentId: number, studentName: string) => {
    setStudentToUnenroll({ enrollmentId, studentName });
    setShowUnenrollModal(true);
  };

  const confirmUnenroll = () => {
    if (studentToUnenroll) {
      unenrollMutation.mutate(studentToUnenroll.enrollmentId);
      setStudentToUnenroll(null);
    }
  };

  const isLoading = enrollmentsLoading || coursesLoading || usersLoading;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="mt-2 text-gray-600">
            Manage student enrollments for your courses
          </p>
        </div>

        {error && <ErrorBanner message={error} />}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Course Selection Sidebar */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Select Course
                </h2>
                
                {availableCourses.length === 0 ? (
                  <p className="text-sm text-gray-500">No courses available</p>
                ) : (
                  <div className="space-y-2">
                    {availableCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedCourseId === course.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="mt-1 text-sm text-gray-500">
                          {enrollments?.filter(e => e.courseId === course.id).length || 0} enrolled
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCourseId ? (
                <>
                  {/* Enroll Student Form */}
                  <div className="rounded-lg bg-white p-6 shadow-md">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <UserPlus className="h-5 w-5 text-green-600" />
                      Enroll New Student
                    </h2>
                    
                    <form onSubmit={handleEnrollStudent} className="space-y-4">
                      <div>
                        <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Student Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <input
                            id="studentEmail"
                            type="email"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="student@example.com"
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={enrollMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                      </button>
                    </form>
                  </div>

                  {/* Enrolled Students List */}
                  <div className="rounded-lg bg-white p-6 shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Users className="h-5 w-5 text-blue-600" />
                        Enrolled Students ({enrolledStudents.length})
                      </h2>
                    </div>

                    {enrolledStudents.length > 0 && (
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {filteredStudents.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-600">
                          {searchQuery ? 'No students found matching your search' : 'No students enrolled yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredStudents.map(({ enrollment, student }) => (
                          <div
                            key={enrollment.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{student!.fullName}</div>
                              <div className="text-sm text-gray-500">{student!.email}</div>
                              <div className="mt-1 text-xs text-gray-400">
                                Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                {enrollment.isCompleted && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnenroll(enrollment.id, student!.fullName)}
                              disabled={unenrollMutation.isPending}
                              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Unenroll
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Select a Course
                  </h3>
                  <p className="mt-2 text-gray-600">
                    Choose a course from the sidebar to manage its enrollments
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showUnenrollModal}
        onClose={() => setShowUnenrollModal(false)}
        onConfirm={confirmUnenroll}
        title="Unenroll Student"
        message={`Are you sure you want to unenroll ${studentToUnenroll?.studentName || 'this student'}? They will lose access to all course materials.`}
        confirmText="Unenroll"
        cancelText="Cancel"
      />
    </AppShell>
  );
};
