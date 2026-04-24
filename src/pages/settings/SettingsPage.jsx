import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Lock, Settings, Receipt } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { usePlatformSettings } from '../../hooks/usePlatformSettings';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ThemeSettings from '../../components/ThemeSettings';

const phoneRegex = /^[+\d][\d\s().-]{6,19}$/;

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email').max(120, 'Email too long'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone too long')
    .refine((v) => v === '' || phoneRegex.test(v), 'Invalid phone number')
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password too long'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'New password must be different from current',
    path: ['newPassword'],
  });

const platformSchema = z.object({
  platformName: z.string().trim().min(2, 'Platform name is required').max(80),
  supportEmail: z.string().trim().email('Invalid support email'),
  timezone: z.string().trim().min(1, 'Timezone is required').max(64),
  currency: z.string().trim().min(3, 'Currency code required').max(8),
  defaultTrialDays: z.coerce.number().int('Must be whole number').min(0).max(365),
  emailNotifications: z.coerce.boolean(),
  maintenanceMode: z.coerce.boolean(),
  allowNewSignups: z.coerce.boolean(),
});

const billingSchema = z.object({
  companyName: z.string().trim().max(120).optional().or(z.literal('')),
  companyGstin: z.string().trim().max(32).optional().or(z.literal('')),
  companyPan: z.string().trim().max(20).optional().or(z.literal('')),
  companyAddress: z.string().trim().max(300).optional().or(z.literal('')),
  companyState: z.string().trim().max(64).optional().or(z.literal('')),
  companyPincode: z.string().trim().max(10).optional().or(z.literal('')),
  companyCountry: z.string().trim().max(64).optional().or(z.literal('')),
  defaultGstRate: z.coerce.number().min(0).max(100),
  defaultHsnCode: z.string().trim().min(1).max(16),
  invoicePrefix: z.string().trim().min(1).max(12),
});

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
];

const MAINTENANCE_OPTIONS = [
  { value: false, label: 'Off' },
  { value: true, label: 'On' },
];

const NOTIFICATION_OPTIONS = [
  { value: true, label: 'Enabled' },
  { value: false, label: 'Disabled' },
];

const SIGNUP_OPTIONS = [
  { value: true, label: 'Allowed' },
  { value: false, label: 'Blocked' },
];

function extractServerError(err, fallback) {
  const data = err?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e.msg).join(', ');
  }
  return data?.message || fallback;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-600 dark:text-slate-400">
        Manage your profile and platform configuration
      </p>

      <ThemeSettings />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileCard user={user} updateUser={updateUser} />
        <PasswordCard />
        <PlatformCard />
        <BillingCard />
      </div>
    </div>
  );
}

function BillingCard() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      companyName: '', companyGstin: '', companyPan: '', companyAddress: '',
      companyState: '', companyPincode: '', companyCountry: 'India',
      defaultGstRate: 18, defaultHsnCode: '998314', invoicePrefix: 'INV-',
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(endpoints.settings.platform);
        const data = res.data?.data || res.data || {};
        if (cancelled) return;
        reset({
          companyName: data.companyName ?? '',
          companyGstin: data.companyGstin ?? '',
          companyPan: data.companyPan ?? '',
          companyAddress: data.companyAddress ?? '',
          companyState: data.companyState ?? '',
          companyPincode: data.companyPincode ?? '',
          companyCountry: data.companyCountry ?? 'India',
          defaultGstRate: Number(data.defaultGstRate ?? 18),
          defaultHsnCode: data.defaultHsnCode ?? '998314',
          invoicePrefix: data.invoicePrefix ?? 'INV-',
        });
      } catch (err) {
        if (!cancelled) toast.error(extractServerError(err, 'Failed to load billing settings'));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(endpoints.settings.updatePlatform, data);
      toast.success('Billing identity updated');
      reset(data);
    } catch (err) {
      toast.error(extractServerError(err, 'Failed to update billing settings'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Invoice / GST Identity</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Printed on every tax invoice. CGST/SGST vs IGST is decided by comparing your company state to the customer's state.
      </p>
      {fetching ? (
        <div className="py-10 flex justify-center"><Spinner size="md" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company Name" error={errors.companyName?.message} {...register('companyName')} />
            <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" error={errors.companyGstin?.message} {...register('companyGstin')} />
            <Input label="PAN" placeholder="ABCDE1234F" error={errors.companyPan?.message} {...register('companyPan')} />
            <Input label="Country" error={errors.companyCountry?.message} {...register('companyCountry')} />
            <div className="sm:col-span-2">
              <Input label="Registered Address" error={errors.companyAddress?.message} {...register('companyAddress')} />
            </div>
            <Input label="State" placeholder="Karnataka" error={errors.companyState?.message} {...register('companyState')} />
            <Input label="Pincode" error={errors.companyPincode?.message} {...register('companyPincode')} />
            <Input label="Default GST Rate (%)" type="number" step="0.01" error={errors.defaultGstRate?.message} {...register('defaultGstRate')} />
            <Input label="Default HSN/SAC Code" error={errors.defaultHsnCode?.message} {...register('defaultHsnCode')} />
            <Input label="Invoice Prefix" error={errors.invoicePrefix?.message} {...register('invoicePrefix')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!isDirty || loading}>Save Billing Settings</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function ProfileCard({ user, updateUser }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(endpoints.settings.profile);
        const data = res.data?.data || res.data || {};
        if (cancelled) return;
        reset({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
      } catch (err) {
        if (!cancelled) {
          reset({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
          toast.error(extractServerError(err, 'Failed to load profile'));
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reset, user?.name, user?.email, user?.phone]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { name: data.name.trim(), email: data.email.trim(), phone: data.phone?.trim() || null };
      const res = await api.put(endpoints.settings.updateProfile, payload);
      const updated = res.data?.data || res.data;
      updateUser({ ...user, ...updated });
      reset({ name: updated.name || '', email: updated.email || '', phone: updated.phone || '' });
      toast.success('Profile updated');
    } catch (err) {
      const msg = extractServerError(err, 'Failed to update profile');
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((e) => e.field && setError(e.field, { type: 'server', message: e.message }));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Profile</h2>
      </div>
      {fetching ? (
        <div className="py-10 flex justify-center"><Spinner size="md" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Full Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!isDirty || loading}>Save Changes</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function PasswordCard() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(endpoints.settings.changePassword, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated');
      reset();
    } catch (err) {
      const msg = extractServerError(err, 'Failed to update password');
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((e) => e.field && setError(e.field, { type: 'server', message: e.message }));
      } else if (/current password/i.test(msg)) {
        setError('currentPassword', { type: 'server', message: msg });
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
          <Lock className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Current Password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New Password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm Password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={loading}>Update Password</Button>
        </div>
      </form>
    </Card>
  );
}

function PlatformCard() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { refresh: refreshPlatform } = usePlatformSettings();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      platformName: '',
      supportEmail: '',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      defaultTrialDays: 14,
      emailNotifications: true,
      maintenanceMode: false,
      allowNewSignups: true,
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(endpoints.settings.platform);
        const data = res.data?.data || res.data || {};
        if (cancelled) return;
        reset({
          platformName: data.platformName ?? '',
          supportEmail: data.supportEmail ?? '',
          timezone: data.timezone ?? 'Asia/Kolkata',
          currency: data.currency ?? 'INR',
          defaultTrialDays: Number(data.defaultTrialDays ?? 14),
          emailNotifications: Boolean(data.emailNotifications),
          maintenanceMode: Boolean(data.maintenanceMode),
          allowNewSignups: Boolean(data.allowNewSignups),
        });
      } catch (err) {
        if (!cancelled) toast.error(extractServerError(err, 'Failed to load platform settings'));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.put(endpoints.settings.updatePlatform, data);
      const updated = res.data?.data || res.data || data;
      reset({
        platformName: updated.platformName ?? '',
        supportEmail: updated.supportEmail ?? '',
        timezone: updated.timezone ?? 'Asia/Kolkata',
        currency: updated.currency ?? 'INR',
        defaultTrialDays: Number(updated.defaultTrialDays ?? 14),
        emailNotifications: Boolean(updated.emailNotifications),
        maintenanceMode: Boolean(updated.maintenanceMode),
        allowNewSignups: Boolean(updated.allowNewSignups),
      });
      toast.success('Platform settings updated');
      await refreshPlatform();
      // Reload so all already-rendered components re-fetch and reformat with the new currency
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = extractServerError(err, 'Failed to update settings');
      const fieldErrors = err?.response?.data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((e) => e.field && setError(e.field, { type: 'server', message: e.message }));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 lg:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-purple-600 dark:text-purple-300" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Platform Settings</h2>
      </div>
      {fetching ? (
        <div className="py-10 flex justify-center"><Spinner size="md" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Platform Name" error={errors.platformName?.message} {...register('platformName')} />
            <Input label="Support Email" type="email" error={errors.supportEmail?.message} {...register('supportEmail')} />
            <Input label="Timezone" error={errors.timezone?.message} {...register('timezone')} />
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select
                  label="Currency"
                  options={CURRENCY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.currency?.message}
                />
              )}
            />
            <Input
              label="Default Trial Days"
              type="number"
              min={0}
              max={365}
              error={errors.defaultTrialDays?.message}
              {...register('defaultTrialDays')}
            />
            <Controller
              control={control}
              name="maintenanceMode"
              render={({ field }) => (
                <Select
                  label="Maintenance Mode"
                  options={MAINTENANCE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.maintenanceMode?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="emailNotifications"
              render={({ field }) => (
                <Select
                  label="Email Notifications"
                  options={NOTIFICATION_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.emailNotifications?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="allowNewSignups"
              render={({ field }) => (
                <Select
                  label="Allow New Signups"
                  options={SIGNUP_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.allowNewSignups?.message}
                />
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!isDirty || loading}>Save Platform Settings</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
