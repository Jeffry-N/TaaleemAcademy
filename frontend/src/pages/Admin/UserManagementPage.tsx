import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { fetchUsers, register, updateUser } from '../../api/taaleem';
import { Spinner } from '../../components/Spinner';
import { ErrorBanner } from '../../components/ErrorBanner';

export const UserManagementPage = () => {
  const { data: users, isLoading, error, refetch } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Instructor' as 'Instructor'|'Admin'|'Student' });
  const [updateError, setUpdateError] = useState<string | null>(null);

  const registerMut = useMutation({
    mutationFn: () => register(form),
    onSuccess: () => { setForm({ fullName: '', email: '', password: '', role: 'Instructor' }); refetch(); },
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const user = users?.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      return updateUser(userId, { 
        id: userId,
        fullName: user.fullName, 
        email: user.email, 
        role: user.role, 
        isActive 
      });
    },
    onSuccess: () => {
      setUpdateError(null);
      refetch();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update user';
      setUpdateError(msg);
      console.error('Update user error:', err.response?.data);
    },
  });

  if (isLoading) return (<div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner/></div>);
  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load users'} />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">User Management</h1>
        
        {updateError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {updateError}
          </div>
        )}
        
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
                  <th className="p-2">Status</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.fullName}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'Instructor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-2">
                      <button
                        onClick={() => toggleActiveMut.mutate({ userId: u.id, isActive: !u.isActive })}
                        disabled={toggleActiveMut.isPending}
                        className={`rounded px-3 py-1 text-xs font-semibold transition ${
                          u.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
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
