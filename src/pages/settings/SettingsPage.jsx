import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Lock, Settings } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});

const platformSchema = z.object({
  platformName: z.string().min(2, 'Platform name is required'),
  supportEmail: z.string().email('Invalid email'),
  defaultTrialDays: z.coerce.number().min(0),
  maintenanceMode: z.string().optional(),
});

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileCard user={user} updateUser={updateUser} />
        <PasswordCard />
        <PlatformCard />
      </div>
    </div>
  );
}

function ProfileCard({ user, updateUser }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put(endpoints.settings.updateProfile, data);
      updateUser(res.data.data || res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Profile</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(endpoints.auth.changePassword, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <Lock className="w-4 h-4 text-yellow-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Current Password" type="password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New Password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Update Password</Button>
        </div>
      </form>
    </Card>
  );
}

function PlatformCard() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(platformSchema),
    defaultValues: { platformName: 'HMS Platform', supportEmail: 'support@hms.com', defaultTrialDays: 14, maintenanceMode: 'false' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(endpoints.settings.updatePlatform, {
        ...data,
        maintenanceMode: data.maintenanceMode === 'true',
      });
      toast.success('Platform settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Platform Settings</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Platform Name" error={errors.platformName?.message} {...register('platformName')} />
          <Input label="Support Email" type="email" error={errors.supportEmail?.message} {...register('supportEmail')} />
          <Input label="Default Trial Days" type="number" error={errors.defaultTrialDays?.message} {...register('defaultTrialDays')} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('maintenanceMode')}
            >
              <option value="false">Off</option>
              <option value="true">On</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Save Platform Settings</Button>
        </div>
      </form>
    </Card>
  );
}
