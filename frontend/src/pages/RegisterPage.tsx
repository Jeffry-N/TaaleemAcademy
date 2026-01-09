import { useState } from 'react';
import { BookOpen, Mail, Lock, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register } from '../api/taaleem';
import { ErrorBanner } from '../components/ErrorBanner';

export const RegisterPage = () => {
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Student' as const });
  const [error, setError] = useState<string | null>(null);

  const regMut = useMutation({
    mutationFn: () => register(form),
    onSuccess: () => nav('/login'),
    onError: (e: any) => setError(e?.message ?? 'Registration failed'),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    regMut.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="mt-2 text-gray-600">Join Taaleem Academy as a Student</p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                value={form.fullName}
                onChange={(e) => setForm(f=>({...f, fullName: e.target.value}))}
                required
                className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f=>({...f, email: e.target.value}))}
                required
                className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm(f=>({...f, password: e.target.value}))}
                required
                className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={regMut.isPending}
            className="w-full rounded-lg bg-blue-600 py-3 px-4 font-semibold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {regMut.isPending ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Already have an account?</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
};
