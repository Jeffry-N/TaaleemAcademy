import { useState } from 'react';
import { Home, BookOpen, Award, Settings, Bell, Menu, X, Search, LogOut, UserCircle, Layers, Users, ClipboardList, UserPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentNav = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, to: '/dashboard' },
  { id: 'courses', name: 'Courses', icon: BookOpen, to: '/courses' },
  { id: 'progress', name: 'My Progress', icon: ClipboardList, to: '/progress' },
  { id: 'attempts', name: 'My Attempts', icon: ClipboardList, to: '/attempts' },
  { id: 'certificates', name: 'Certificates', icon: Award, to: '/certificates' },
  { id: 'settings', name: 'Settings', icon: Settings, to: '/settings' },
];

const instructorNav = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, to: '/dashboard' },
  { id: 'manage-courses', name: 'Manage Courses', icon: Layers, to: '/instructor/courses' },
  { id: 'enrollments', name: 'Enrollments', icon: UserPlus, to: '/enrollments' },
  { id: 'quizzes', name: 'Quiz Builder', icon: ClipboardList, to: '/instructor/quizzes' },
  { id: 'settings', name: 'Settings', icon: Settings, to: '/settings' },
];

const adminNav = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, to: '/dashboard' },
  { id: 'users', name: 'User Management', icon: Users, to: '/admin/users' },
  { id: 'categories', name: 'Categories', icon: Layers, to: '/admin/categories' },
  { id: 'courses', name: 'Courses', icon: Layers, to: '/instructor/courses' },
  { id: 'enrollments', name: 'Enrollments', icon: UserPlus, to: '/enrollments' },
  { id: 'settings', name: 'Settings', icon: Settings, to: '/settings' },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const role = user?.role ?? 'Student';
  const navItems = role === 'Admin' ? adminNav : role === 'Instructor' ? instructorNav : studentNav;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 z-30 w-full border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-600 hover:text-gray-900 lg:hidden">
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="rounded-lg bg-blue-600 p-2">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="hidden text-xl font-bold text-gray-900 sm:block">Taaleem Academy</span>
            </Link>
          </div>

          <div className="hidden flex-1 max-w-xl items-center md:flex">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative text-gray-600 hover:text-gray-900" aria-label="Notifications">
              <Bell className="h-6 w-6" />
              <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2 rounded-lg px-2 py-1 text-gray-700 hover:bg-gray-100">
                <UserCircle className="h-6 w-6" />
                <div className="hidden text-left text-sm sm:block">
                  <div className="font-semibold text-gray-900">{user?.fullName ?? 'Guest'}</div>
                  <div className="text-xs text-gray-500">{user?.role ?? 'Signed out'}</div>
                </div>
              </button>
              <div className="absolute right-0 mt-2 hidden w-48 rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block">
                <div className="px-4 py-3 text-sm">
                  <div className="font-semibold text-gray-900">{user?.fullName ?? 'Guest user'}</div>
                  <div className="text-gray-600">{user?.email ?? 'Not signed in'}</div>
                </div>
                <div className="border-t px-2 py-1 text-sm">
                  <button
                    onClick={logout}
                    className="flex w-full items-center space-x-2 rounded-md px-2 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed left-0 top-16 z-20 h-full w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="mt-16 min-h-screen lg:ml-64">
        <div className="px-4 py-6 lg:px-8">{children}</div>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black bg-opacity-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};
