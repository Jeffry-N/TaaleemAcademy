import { BookOpen, Award, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  const categories = [
    { name: 'Web Development', icon: '💻', courses: 45, color: 'bg-blue-100 text-blue-600' },
    { name: 'Data Science', icon: '📊', courses: 32, color: 'bg-purple-100 text-purple-600' },
    { name: 'Mobile Development', icon: '📱', courses: 28, color: 'bg-green-100 text-green-600' },
    { name: 'UI/UX Design', icon: '🎨', courses: 24, color: 'bg-pink-100 text-pink-600' },
    { name: 'Backend Development', icon: '⚙️', courses: 38, color: 'bg-orange-100 text-orange-600' },
    { name: 'DevOps', icon: '🚀', courses: 19, color: 'bg-indigo-100 text-indigo-600' },
  ];

  const featuredCourses = [
    {
      id: 1,
      title: 'Complete React.js Masterclass',
      instructor: 'Sarah Johnson',
      rating: 4.8,
      students: 12453,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      category: 'Web Development',
      price: 'Free',
    },
    {
      id: 2,
      title: 'Python for Data Science',
      instructor: 'Dr. Emily White',
      rating: 4.9,
      students: 15678,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
      category: 'Data Science',
      price: 'Free',
    },
    {
      id: 3,
      title: 'UI/UX Design Fundamentals',
      instructor: 'Jessica Lee',
      rating: 4.7,
      students: 9876,
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
      category: 'Design',
      price: 'Free',
    },
  ];

  const stats = [
    { label: 'Active Students', value: '50,000+', icon: Users },
    { label: 'Total Courses', value: '200+', icon: BookOpen },
    { label: 'Certificates Issued', value: '30,000+', icon: Award },
    { label: 'Success Rate', value: '95%', icon: TrendingUp },
  ];

  const features = [
    'Lifetime access to all courses',
    'Learn at your own pace',
    'Certificate of completion',
    'Expert instructors',
    'Mobile-friendly platform',
    'Community support',
  ];

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
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">Online Internship Program</p>
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${category.color}`}>{category.icon}</div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">{category.courses} courses</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="featured" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">Featured Courses</h2>
            <p className="text-xl text-gray-600">Start learning with our most popular courses</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <div key={course.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <img src={course.thumbnail} alt={course.title} className="h-48 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{course.category}</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.instructor}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className="font-semibold text-amber-500">★ {course.rating}</span>
                    <span>{course.students.toLocaleString()} students</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{course.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <div className="rounded-lg bg-blue-600 p-2">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-bold">Taaleem Academy</span>
              </div>
              <p className="text-sm text-gray-400">Upskill with expert-led courses and earn verifiable certificates.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/courses" className="hover:text-white">Courses</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><span className="cursor-pointer hover:text-white">Help Center</span></li>
                <li><span className="cursor-pointer hover:text-white">Contact</span></li>
                <li><span className="cursor-pointer hover:text-white">Status</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><span className="cursor-pointer hover:text-white">Privacy</span></li>
                <li><span className="cursor-pointer hover:text-white">Terms</span></li>
                <li><span className="cursor-pointer hover:text-white">Cookies</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-6 text-center text-sm text-gray-400">© 2025 Taaleem Academy. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
