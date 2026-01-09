import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/taaleem';
import { AppShell } from '../components/AppShell';
import { ErrorBanner } from '../components/ErrorBanner';

export const SettingsPage = () => {
  const { user, updateUserData } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateProfileMut = useMutation({
    mutationFn: async (payload: { fullName: string; email: string; password?: string }) => {
      if (!user) throw new Error('User not found');
      
      const updatePayload: any = {
        fullName: payload.fullName,
        email: payload.email,
        role: user.role,
        isActive: true,
      };

      if (payload.password) {
        updatePayload.password = payload.password;
      }

      return updateUser(user.userId, updatePayload);
    },
    onSuccess: (data) => {
      setSuccess('Profile updated successfully!');
      setError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Update auth context with new data
      updateUserData({
        fullName: data.fullName,
        email: data.email,
      });
      
      // Invalidate queries that might use user data
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to update profile. Please try again.');
      setSuccess(null);
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate inputs
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    // If changing password, validate all password fields
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password');
        return;
      }

      if (!newPassword) {
        setError('New password is required');
        return;
      }

      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
    }

    const payload: any = {
      fullName,
      email,
    };

    // Only include password if user wants to change it
    if (newPassword) {
      payload.password = newPassword;
    }

    updateProfileMut.mutate(payload);
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex h-screen items-center justify-center">
          <p className="text-gray-500">Please log in to access settings.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your profile information and password</p>
        </div>

        {error && <ErrorBanner message={error} />}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-8">
          {/* Profile Information Section */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="rounded-lg border border-gray-300 bg-gray-50 py-2 px-4">
                  <span className="font-medium text-gray-700">{user.role}</span>
                  <span className="ml-2 text-sm text-gray-500">(Cannot be changed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Change Password</h2>
            <p className="mb-6 text-sm text-gray-600">Leave blank if you don't want to change your password</p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-5 w-5" />
              {updateProfileMut.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};
