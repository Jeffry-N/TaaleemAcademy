import { useQuery } from '@tanstack/react-query';
import { BookOpen, Award, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchCourses, fetchUsers, fetchCertificates, fetchQuizAttempts } from '../api/taaleem';
import { Spinner } from '../components/Spinner';

const categoryIconMap: Record<string, string> = {
  'Software Development': '💻',
  'Mathematics & Statistics': '📊',
  'Design & Creativity': '🎨',
  'Finance & Accounting': '📈',
  'default': '📚',
};

const categoryColorMap: Record<string, string> = {
  'Software Development': 'bg-blue-100 text-blue-600',
  'Mathematics & Statistics': 'bg-purple-100 text-purple-600',
  'Design & Creativity': 'bg-pink-100 text-pink-600',
  'Finance & Accounting': 'bg-yellow-100 text-yellow-600',
  'default': 'bg-gray-100 text-gray-600',
};

export const LandingPage = () => {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
  });

  const { data: quizAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['quizAttempts'],
    queryFn: fetchQuizAttempts,
  });

  // Get featured courses (published ones, limited to first 3)
  const featuredCourses = courses?.filter(c => c.isPublished).slice(0, 3) || [];

  // Calculate course counts by category
  const categoriesWithCounts = categories?.map(cat => ({
    ...cat,
    courseCount: courses?.filter(c => c.categoryId === cat.id && c.isPublished).length || 0,
    icon: categoryIconMap[cat.name] || categoryIconMap.default,
    color: categoryColorMap[cat.name] || categoryColorMap.default,
  })) || [];

  // Calculate success rate from quiz attempts
  const passedAttempts = quizAttempts?.filter(qa => qa.isPassed).length || 0;
  const totalAttempts = quizAttempts?.length || 0;
  const successRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  // Dynamic stats based on actual data
  const studentCount = users?.filter(u => u.role === 'Student').length || 0;
  const stats = [
    { label: 'Active Students', value: studentCount.toString(), icon: Users },
    { label: 'Total Courses', value: (courses?.filter(c => c.isPublished).length || 0).toString(), icon: BookOpen },
    { label: 'Certificates Issued', value: (certificates?.length || 0).toString(), icon: Award },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp },
  ];

  const features = [
    'Lifetime access to all courses',
    'Learn at your own pace',
    'Certificate of completion',
    'Expert instructors',
    'Mobile-friendly platform',
    'Community support',
  ];
users
  const isLoading = categoriesLoading || coursesLoading || usersLoading || certificatesLoading || attemptsLoading;

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-600 p-2">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Taaleem Academy</span>
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            <a className="text-sm font-semibold text-gray-700 hover:text-blue-600" href="#categories">Categories</a>
            <a className="text-sm font-semibold text-gray-700 hover:text-blue-600" href="#featured">Featured</a>
            <a className="text-sm font-semibold text-gray-700 hover:text-blue-600" href="#why">Why Us</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-blue-600">Log in</Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">Create account</Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Learn. Build. Earn your certificate.</h1>
            <p className="mt-4 max-w-2xl text-lg text-blue-100">Join thousands of learners mastering development, data, design, and more with real projects and verified certificates.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow hover:bg-blue-50">Get started free</Link>
              <Link to="/courses" className="rounded-lg border border-white/50 px-6 py-3 font-semibold text-white hover:bg-white/10">Browse courses</Link>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600"
              alt="Students learning"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section id="stats" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="categories" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Popular Categories</h2>
            <p className="text-xl text-gray-600">Explore courses across different domains</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoriesWithCounts.map((category) => (
                <div key={category.id} className="flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${category.color}`}>{category.icon}</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.courseCount} courses</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="featured" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Featured Courses</h2>
            <p className="text-xl text-gray-600">Start learning with our most popular courses</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center"><Spinner /></div>
          ) : featuredCourses.length === 0 ? (
            <div className="text-center text-gray-500">No courses available yet</div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <Link key={course.id} to={`/courses?id=${course.id}`} className="block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                  <img
                    src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400'}
                    alt={course.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {categories?.find(c => c.id === course.categoryId)?.name || 'Course'}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600">Difficulty: {course.difficulty || 'Beginner'}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Free</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/courses" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow hover:bg-blue-700">View all courses</Link>
          </div>
        </div>
      </section>

      <section id="why" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Why learners choose us</h2>
              <p className="mb-6 text-lg text-gray-600">Learn from industry experts with a clear path to verified certificates and portfolio-ready projects.</p>
              <ul className="space-y-3 text-gray-700">
                {features.map((f) => (
                  <li key={f} className="flex items-center space-x-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600"
                alt="Learning"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-6 text-4xl font-bold">Ready to start learning?</h2>
          <p className="mb-8 text-xl text-blue-100">Join thousands of students already learning on Taaleem Academy.</p>
          <Link to="/register" className="rounded-lg bg-white px-10 py-4 text-lg font-bold text-blue-600 shadow hover:bg-blue-50">Create free account</Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-12 text-gray-900">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <div className="rounded-lg bg-blue-600 p-2">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold">Taaleem Academy</span>
              </div>
              <p className="text-sm text-gray-600">Upskill with expert-led courses and earn verifiable certificates.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/courses" className="hover:text-blue-600">Courses</Link></li>
                <li><Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-blue-600">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="cursor-pointer hover:text-blue-600">Help Center</span></li>
                <li><span className="cursor-pointer hover:text-blue-600">Contact</span></li>
                <li><span className="cursor-pointer hover:text-blue-600">Status</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><span className="cursor-pointer hover:text-blue-600">Privacy</span></li>
                <li><span className="cursor-pointer hover:text-blue-600">Terms</span></li>
                <li><span className="cursor-pointer hover:text-blue-600">Cookies</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">© 2025 Taaleem Academy. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
