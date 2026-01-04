import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, User, Star, Sparkles } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { createEnrollment, fetchCategories, fetchCourses } from '../api/taaleem';
import type { Course } from '../types/api';
import { parseApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

const difficultyOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export const CourseListPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const {
    data: courses,
    isLoading: isCoursesLoading,
    error: coursesError,
  } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });

  const enrollmentMutation = useMutation({
    mutationFn: ({ courseId }: { courseId: number }) => {
      if (!user) throw new Error('You must be logged in to enroll.');
      return createEnrollment(user.userId, courseId);
    },
    onSuccess: () => {
      setFeedback('Enrolled successfully!');
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error) => {
      setFeedback(parseApiError(error));
    },
  });

  const filteredCourses = useMemo(() => {
    if (!courses) return [] as Course[];
    return courses
      .filter((course) => course.isPublished)
      .filter((course) => {
        if (categoryFilter !== 'All') {
          const categoryName = categories?.find((c) => c.id === course.categoryId)?.name;
          return categoryName === categoryFilter;
        }
        return true;
      })
      .filter((course) => (difficultyFilter === 'All' ? true : course.difficulty === difficultyFilter))
      .filter((course) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return course.title.toLowerCase().includes(q) || (course.shortDescription ?? '').toLowerCase().includes(q);
      });
  }, [courses, categories, categoryFilter, difficultyFilter, search]);

  const handleEnroll = (courseId: number) => {
    setFeedback(null);
    enrollmentMutation.mutate({ courseId });
  };

  const loading = isCategoriesLoading || isCoursesLoading;
  const errorMsg = categoriesError ? parseApiError(categoriesError) : coursesError ? parseApiError(coursesError) : null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Browse Courses
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Find your next course</h1>
            <p className="text-gray-600">Explore our collection of published courses from Taaleem Academy</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                {categories?.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {difficultyOptions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {feedback && <div className="mb-4 text-sm text-blue-700">{feedback}</div>}
        {errorMsg && <div className="mb-4"><ErrorBanner message={errorMsg} /></div>}
        {loading && <Spinner />}

        {!loading && !errorMsg && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const category = categories?.find((c) => c.id === course.categoryId);
              return (
                <div key={course.id} className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{category?.name ?? 'Course'}</p>
                      <h3 className="mt-1 text-xl font-bold text-gray-900">{course.title}</h3>
                      <p className="mt-2 max-h-12 overflow-hidden text-ellipsis text-sm text-gray-600">{course.shortDescription ?? 'No description provided.'}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-3 py-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.difficulty}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-3 py-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.estimatedDuration ? `${course.estimatedDuration} min` : 'Self paced'}</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-3 py-1">
                      <User className="h-4 w-4" />
                      <span>Instructor {course.createdBy}</span>
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-5">
                    <div className="flex items-center space-x-1 text-sm font-semibold text-amber-500">
                      <Star className="h-4 w-4" />
                      <span>4.8</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollmentMutation.isPending}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {enrollmentMutation.isPending ? 'Enrolling...' : 'Enroll'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && !errorMsg && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            No courses found with current filters.
          </div>
        )}
      </div>
    </AppShell>
  );
};
