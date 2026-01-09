import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { fetchUsers, register } from '../../api/taaleem';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';

export const UserManagementPage = () => {
  const { data: users, isLoading, error, refetch } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Instructor' as 'Instructor'|'Admin'|'Student' });

  const registerMut = useMutation({
    mutationFn: () => register(form),
    onSuccess: () => { setForm({ fullName: '', email: '', password: '', role: 'Instructor' }); refetch(); },
  });

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load users'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">User Management</h1>
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 text-lg font-semibold">Create User</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input className="rounded border border-gray-300 p-2" placeholder="Full Name" value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} />
            <input className="rounded border border-gray-300 p-2" placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            <input type="password" className="rounded border border-gray-300 p-2" placeholder="Password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
            <select className="rounded border border-gray-300 p-2" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value as any}))}>
              <option>Instructor</option>
              <option>Admin</option>
              <option>Student</option>
            </select>
          </div>
          <div className="mt-3">
            <button onClick={()=>registerMut.mutate()} disabled={!form.fullName || !form.email || !form.password} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create</button>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 text-lg font-semibold">All Users</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.fullName}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">{u.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
